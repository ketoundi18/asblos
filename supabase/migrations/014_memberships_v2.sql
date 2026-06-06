-- v2 : cotisation ASBL configurable + adhésions par année scolaire
-- Prérequis : 010_parent_enrollment.sql
-- Safe à relancer

-- ---------------------------------------------------------------------------
-- Année scolaire courante (Belgique : sept → août)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_school_year()
RETURNS TEXT
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN EXTRACT(MONTH FROM CURRENT_DATE) >= 9 THEN
      EXTRACT(YEAR FROM CURRENT_DATE)::TEXT || '-' ||
      (EXTRACT(YEAR FROM CURRENT_DATE) + 1)::TEXT
    ELSE
      (EXTRACT(YEAR FROM CURRENT_DATE) - 1)::TEXT || '-' ||
      EXTRACT(YEAR FROM CURRENT_DATE)::TEXT
  END;
$$;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE membership_status AS ENUM (
    'AWAITING_PAYMENT',
    'AWAITING_ASBL',
    'ACTIVE',
    'REJECTED',
    'CANCELLED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- asbl_settings — tarifs configurables (0 € = gratuit)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS asbl_settings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_year           TEXT NOT NULL UNIQUE,
  enrollment_fee_cents  INT NOT NULL DEFAULT 0 CHECK (enrollment_fee_cents >= 0),
  currency              TEXT NOT NULL DEFAULT 'EUR',
  effective_from        DATE NOT NULL DEFAULT CURRENT_DATE,
  updated_by            UUID REFERENCES profiles(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS asbl_settings_updated_at ON asbl_settings;
CREATE TRIGGER asbl_settings_updated_at
  BEFORE UPDATE ON asbl_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

INSERT INTO asbl_settings (school_year, enrollment_fee_cents)
VALUES (public.current_school_year(), 0)
ON CONFLICT (school_year) DO NOTHING;

-- ---------------------------------------------------------------------------
-- memberships — 1 enfant × 1 année scolaire
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS memberships (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id            UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  parent_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  school_year         TEXT NOT NULL,
  fee_cents           INT NOT NULL DEFAULT 0 CHECK (fee_cents >= 0),
  status              membership_status NOT NULL,
  asbl_validated_at   TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (child_id, school_year)
);

CREATE INDEX IF NOT EXISTS memberships_child_id_idx ON memberships(child_id);
CREATE INDEX IF NOT EXISTS memberships_parent_id_idx ON memberships(parent_id);
CREATE INDEX IF NOT EXISTS memberships_status_idx ON memberships(status);
CREATE INDEX IF NOT EXISTS memberships_school_year_idx ON memberships(school_year);

DROP TRIGGER IF EXISTS memberships_updated_at ON memberships;
CREATE TRIGGER memberships_updated_at
  BEFORE UPDATE ON memberships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- Données existantes : créer memberships depuis children (inscriptions parent)
-- ---------------------------------------------------------------------------
INSERT INTO memberships (child_id, parent_id, school_year, fee_cents, status, asbl_validated_at)
SELECT
  c.id,
  COALESCE(
    (SELECT pcl.parent_id FROM parent_child_links pcl WHERE pcl.child_id = c.id ORDER BY pcl.created_at DESC LIMIT 1),
    c.created_by
  ),
  public.current_school_year(),
  COALESCE(
    (SELECT s.enrollment_fee_cents FROM asbl_settings s WHERE s.school_year = public.current_school_year()),
    0
  ),
  CASE c.enrollment_status
    WHEN 'EN_ATTENTE_PAIEMENT' THEN 'AWAITING_PAYMENT'::membership_status
    WHEN 'PAYE_EN_ATTENTE_ASBL' THEN 'AWAITING_ASBL'::membership_status
    WHEN 'VALIDE' THEN 'ACTIVE'::membership_status
    WHEN 'REFUSE' THEN 'REJECTED'::membership_status
    ELSE 'AWAITING_ASBL'::membership_status
  END,
  c.asbl_validated_at
FROM children c
WHERE c.deleted_at IS NULL
  AND c.created_via = 'PARENT'::child_created_via
ON CONFLICT (child_id, school_year) DO NOTHING;

-- ---------------------------------------------------------------------------
-- RLS asbl_settings
-- ---------------------------------------------------------------------------
ALTER TABLE asbl_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "asbl_settings_select_all_staff" ON asbl_settings;
CREATE POLICY "asbl_settings_select_all_staff"
  ON asbl_settings FOR SELECT
  USING (public.is_active_user() AND public.is_staff_full());

DROP POLICY IF EXISTS "asbl_settings_select_parent" ON asbl_settings;
CREATE POLICY "asbl_settings_select_parent"
  ON asbl_settings FOR SELECT
  USING (
    public.is_active_user()
    AND public.is_parent()
  );

DROP POLICY IF EXISTS "asbl_settings_update_admin" ON asbl_settings;
CREATE POLICY "asbl_settings_update_admin"
  ON asbl_settings FOR UPDATE
  USING (public.is_active_user() AND public.get_my_role() = 'ADMIN'::user_role);

DROP POLICY IF EXISTS "asbl_settings_insert_admin" ON asbl_settings;
CREATE POLICY "asbl_settings_insert_admin"
  ON asbl_settings FOR INSERT
  WITH CHECK (public.is_active_user() AND public.get_my_role() = 'ADMIN'::user_role);

-- ---------------------------------------------------------------------------
-- RLS memberships
-- ---------------------------------------------------------------------------
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "memberships_select_staff" ON memberships;
CREATE POLICY "memberships_select_staff"
  ON memberships FOR SELECT
  USING (public.is_active_user() AND public.is_staff_full());

DROP POLICY IF EXISTS "memberships_select_parent" ON memberships;
CREATE POLICY "memberships_select_parent"
  ON memberships FOR SELECT
  USING (
    public.is_active_user()
    AND public.is_parent()
    AND parent_id = auth.uid()
  );

DROP POLICY IF EXISTS "memberships_insert_parent" ON memberships;
CREATE POLICY "memberships_insert_parent"
  ON memberships FOR INSERT
  WITH CHECK (
    public.is_active_user()
    AND public.is_parent()
    AND parent_id = auth.uid()
    AND child_id IN (SELECT public.my_parent_child_ids())
  );

DROP POLICY IF EXISTS "memberships_update_staff" ON memberships;
CREATE POLICY "memberships_update_staff"
  ON memberships FOR UPDATE
  USING (public.is_active_user() AND public.is_staff_full());

DROP POLICY IF EXISTS "memberships_update_parent_payment" ON memberships;
CREATE POLICY "memberships_update_parent_payment"
  ON memberships FOR UPDATE
  USING (
    public.is_active_user()
    AND public.is_parent()
    AND parent_id = auth.uid()
    AND status = 'AWAITING_PAYMENT'::membership_status
  )
  WITH CHECK (
    parent_id = auth.uid()
    AND status IN (
      'AWAITING_PAYMENT'::membership_status,
      'AWAITING_ASBL'::membership_status
    )
  );
