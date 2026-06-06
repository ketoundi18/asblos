-- B1 : Inscription parent — colonnes children, table payments, RLS parent
-- Prérequis : 007a, 007, 008, 009 déjà lancés
-- Safe à relancer (IF NOT EXISTS / DROP POLICY IF EXISTS)

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE child_created_via AS ENUM ('STAFF', 'PARENT');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE child_enrollment_status AS ENUM (
    'BROUILLON',
    'EN_ATTENTE_PAIEMENT',
    'PAYE_EN_ATTENTE_ASBL',
    'VALIDE',
    'REFUSE'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_provider AS ENUM ('MOLLIE', 'STRIPE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('BANCONTACT', 'CARD', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- children : origine + cycle d'inscription
-- ---------------------------------------------------------------------------
ALTER TABLE children
  ADD COLUMN IF NOT EXISTS created_via child_created_via NOT NULL DEFAULT 'STAFF',
  ADD COLUMN IF NOT EXISTS enrollment_status child_enrollment_status NOT NULL DEFAULT 'VALIDE',
  ADD COLUMN IF NOT EXISTS asbl_validated_at TIMESTAMPTZ;

-- Données existantes (créées par le staff) = déjà validées
UPDATE children
SET
  created_via = 'STAFF',
  enrollment_status = 'VALIDE',
  asbl_validated_at = COALESCE(asbl_validated_at, created_at)
WHERE created_via = 'STAFF'
  AND enrollment_status = 'VALIDE'
  AND asbl_validated_at IS NULL;

CREATE INDEX IF NOT EXISTS children_created_via_idx ON children(created_via);
CREATE INDEX IF NOT EXISTS children_enrollment_status_idx ON children(enrollment_status);

-- ---------------------------------------------------------------------------
-- payments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id            UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  parent_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount_cents        INT NOT NULL CHECK (amount_cents > 0),
  currency            TEXT NOT NULL DEFAULT 'EUR',
  provider            payment_provider,
  provider_payment_id TEXT,
  method              payment_method,
  status              payment_status NOT NULL DEFAULT 'PENDING',
  paid_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payments_child_id_idx ON payments(child_id);
CREATE INDEX IF NOT EXISTS payments_parent_id_idx ON payments(parent_id);
CREATE INDEX IF NOT EXISTS payments_status_idx ON payments(status);

DROP TRIGGER IF EXISTS payments_updated_at ON payments;
CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- Helpers RLS parent
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.my_parent_child_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pcl.child_id
  FROM public.parent_child_links pcl
  WHERE pcl.parent_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.my_editable_parent_enrollment_child_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id
  FROM public.children c
  WHERE c.deleted_at IS NULL
    AND c.created_by = auth.uid()
    AND c.created_via = 'PARENT'::child_created_via
    AND c.asbl_validated_at IS NULL
    AND c.enrollment_status <> 'REFUSE'::child_enrollment_status;
$$;

-- ---------------------------------------------------------------------------
-- RLS children — parent peut créer / modifier ses inscriptions
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "children_select_parent_created" ON children;
CREATE POLICY "children_select_parent_created"
  ON children FOR SELECT
  USING (
    deleted_at IS NULL
    AND public.is_active_user()
    AND public.is_parent()
    AND created_by = auth.uid()
    AND created_via = 'PARENT'::child_created_via
  );

DROP POLICY IF EXISTS "children_insert_parent" ON children;
CREATE POLICY "children_insert_parent"
  ON children FOR INSERT
  WITH CHECK (
    public.is_active_user()
    AND public.is_parent()
    AND created_by = auth.uid()
    AND created_via = 'PARENT'::child_created_via
    AND enrollment_status IN (
      'BROUILLON'::child_enrollment_status,
      'EN_ATTENTE_PAIEMENT'::child_enrollment_status
    )
    AND deleted_at IS NULL
  );

DROP POLICY IF EXISTS "children_update_parent" ON children;
CREATE POLICY "children_update_parent"
  ON children FOR UPDATE
  USING (
    public.is_active_user()
    AND public.is_parent()
    AND id IN (SELECT public.my_editable_parent_enrollment_child_ids())
  )
  WITH CHECK (
    created_by = auth.uid()
    AND created_via = 'PARENT'::child_created_via
    AND asbl_validated_at IS NULL
    AND enrollment_status <> 'REFUSE'::child_enrollment_status
  );

-- Staff : peut valider / refuser une inscription parent
DROP POLICY IF EXISTS "children_update_staff_enrollment" ON children;
CREATE POLICY "children_update_staff_enrollment"
  ON children FOR UPDATE
  USING (
    deleted_at IS NULL
    AND public.is_active_user()
    AND public.is_staff_full()
    AND created_via = 'PARENT'::child_created_via
  );

-- ---------------------------------------------------------------------------
-- RLS guardians — parent sur ses fiches en cours
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "guardians_select_parent" ON guardians;
CREATE POLICY "guardians_select_parent"
  ON guardians FOR SELECT
  USING (
    public.is_active_user()
    AND public.is_parent()
    AND (
      child_id IN (SELECT public.my_parent_child_ids())
      OR child_id IN (SELECT public.my_editable_parent_enrollment_child_ids())
    )
  );

DROP POLICY IF EXISTS "guardians_insert_parent" ON guardians;
CREATE POLICY "guardians_insert_parent"
  ON guardians FOR INSERT
  WITH CHECK (
    public.is_active_user()
    AND public.is_parent()
    AND child_id IN (SELECT public.my_editable_parent_enrollment_child_ids())
  );

DROP POLICY IF EXISTS "guardians_update_parent" ON guardians;
CREATE POLICY "guardians_update_parent"
  ON guardians FOR UPDATE
  USING (
    public.is_active_user()
    AND public.is_parent()
    AND child_id IN (SELECT public.my_editable_parent_enrollment_child_ids())
  );

-- ---------------------------------------------------------------------------
-- RLS parent_child_links — parent crée le lien à l'inscription
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "parent_links_insert_own" ON parent_child_links;
CREATE POLICY "parent_links_insert_own"
  ON parent_child_links FOR INSERT
  WITH CHECK (
    public.is_active_user()
    AND public.is_parent()
    AND parent_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.children c
      WHERE c.id = child_id
        AND c.created_by = auth.uid()
        AND c.created_via = 'PARENT'::child_created_via
        AND c.deleted_at IS NULL
    )
  );

-- ---------------------------------------------------------------------------
-- RLS payments
-- ---------------------------------------------------------------------------
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_select_own" ON payments;
CREATE POLICY "payments_select_own"
  ON payments FOR SELECT
  USING (
    public.is_active_user()
    AND public.is_parent()
    AND parent_id = auth.uid()
  );

DROP POLICY IF EXISTS "payments_select_staff" ON payments;
CREATE POLICY "payments_select_staff"
  ON payments FOR SELECT
  USING (
    public.is_active_user()
    AND public.is_staff_full()
  );

DROP POLICY IF EXISTS "payments_insert_parent" ON payments;
CREATE POLICY "payments_insert_parent"
  ON payments FOR INSERT
  WITH CHECK (
    public.is_active_user()
    AND public.is_parent()
    AND parent_id = auth.uid()
    AND status = 'PENDING'::payment_status
    AND child_id IN (SELECT public.my_parent_child_ids())
  );

DROP POLICY IF EXISTS "payments_update_staff" ON payments;
CREATE POLICY "payments_update_staff"
  ON payments FOR UPDATE
  USING (public.is_active_user() AND public.is_staff_full());
