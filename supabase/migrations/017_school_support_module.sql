-- Module Soutien Scolaire + plans d'adhésion BASE / SCHOOL_SUPPORT
-- Prérequis : 014_memberships_v2.sql
-- Safe à relancer

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE membership_plan AS ENUM ('BASE', 'SCHOOL_SUPPORT');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE school_support_program_status AS ENUM ('DRAFT', 'OPEN', 'CLOSED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE school_support_enrollment_status AS ENUM ('ACTIVE', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- asbl_settings — tarif soutien scolaire (cotisation annuelle)
-- ---------------------------------------------------------------------------
ALTER TABLE asbl_settings
  ADD COLUMN IF NOT EXISTS school_support_fee_cents INT NOT NULL DEFAULT 0
    CHECK (school_support_fee_cents >= 0);

UPDATE asbl_settings
SET school_support_fee_cents = enrollment_fee_cents
WHERE school_support_fee_cents = 0
  AND enrollment_fee_cents > 0;

COMMENT ON COLUMN asbl_settings.school_support_fee_cents IS
  'Cotisation annuelle soutien scolaire (centimes EUR). 0 = gratuit.';

-- ---------------------------------------------------------------------------
-- memberships — plan BASE (inscription simple) ou SCHOOL_SUPPORT
-- ---------------------------------------------------------------------------
ALTER TABLE memberships
  ADD COLUMN IF NOT EXISTS plan membership_plan NOT NULL DEFAULT 'BASE';

UPDATE memberships
SET plan = 'SCHOOL_SUPPORT'::membership_plan
WHERE fee_cents > 0
  AND plan = 'BASE'::membership_plan;

-- ---------------------------------------------------------------------------
-- school_support_programs — offre récurrente par année scolaire
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS school_support_programs (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_year             TEXT NOT NULL,
  title                   TEXT NOT NULL,
  description             TEXT,
  max_participants        INT CHECK (max_participants IS NULL OR max_participants > 0),
  status                  school_support_program_status NOT NULL DEFAULT 'DRAFT',
  parent_registration_open BOOLEAN NOT NULL DEFAULT false,
  created_by              UUID REFERENCES profiles(id),
  updated_by              UUID REFERENCES profiles(id),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS school_support_programs_year_idx
  ON school_support_programs(school_year)
  WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- school_support_slots — créneaux récurrents (jours / horaires)
-- day_of_week : 1 = lundi … 7 = dimanche
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS school_support_slots (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id        UUID NOT NULL REFERENCES school_support_programs(id) ON DELETE CASCADE,
  day_of_week       SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  start_time        TIME NOT NULL,
  end_time          TIME,
  location          TEXT,
  label             TEXT,
  max_participants  INT CHECK (max_participants IS NULL OR max_participants > 0),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS school_support_slots_program_idx
  ON school_support_slots(program_id);

-- ---------------------------------------------------------------------------
-- school_support_enrollments — inscription enfant au programme
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS school_support_enrollments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id    UUID NOT NULL REFERENCES school_support_programs(id) ON DELETE CASCADE,
  child_id      UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  parent_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  membership_id UUID REFERENCES memberships(id) ON DELETE SET NULL,
  status        school_support_enrollment_status NOT NULL DEFAULT 'ACTIVE',
  enrolled_by   UUID REFERENCES profiles(id),
  enrolled_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  cancelled_at  TIMESTAMPTZ,
  UNIQUE (program_id, child_id)
);

CREATE INDEX IF NOT EXISTS school_support_enrollments_child_idx
  ON school_support_enrollments(child_id);

CREATE INDEX IF NOT EXISTS school_support_enrollments_program_idx
  ON school_support_enrollments(program_id)
  WHERE cancelled_at IS NULL;

-- ---------------------------------------------------------------------------
-- Triggers updated_at
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS school_support_programs_updated_at ON school_support_programs;
CREATE TRIGGER school_support_programs_updated_at
  BEFORE UPDATE ON school_support_programs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS school_support_slots_updated_at ON school_support_slots;
CREATE TRIGGER school_support_slots_updated_at
  BEFORE UPDATE ON school_support_slots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- RLS school_support_programs
-- ---------------------------------------------------------------------------
ALTER TABLE school_support_programs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ssp_select_staff" ON school_support_programs;
CREATE POLICY "ssp_select_staff"
  ON school_support_programs FOR SELECT
  USING (deleted_at IS NULL AND public.is_active_user() AND public.is_staff_full());

DROP POLICY IF EXISTS "ssp_select_parent" ON school_support_programs;
CREATE POLICY "ssp_select_parent"
  ON school_support_programs FOR SELECT
  USING (
    deleted_at IS NULL
    AND public.is_active_user()
    AND public.is_parent()
    AND status = 'OPEN'::school_support_program_status
    AND parent_registration_open = true
  );

DROP POLICY IF EXISTS "ssp_insert_staff" ON school_support_programs;
CREATE POLICY "ssp_insert_staff"
  ON school_support_programs FOR INSERT
  WITH CHECK (
    public.is_active_user()
    AND public.get_my_role() IN ('ADMIN'::user_role, 'TRAVAILLEUR'::user_role)
  );

DROP POLICY IF EXISTS "ssp_update_staff" ON school_support_programs;
CREATE POLICY "ssp_update_staff"
  ON school_support_programs FOR UPDATE
  USING (
    deleted_at IS NULL
    AND public.is_active_user()
    AND public.get_my_role() IN ('ADMIN'::user_role, 'TRAVAILLEUR'::user_role)
  );

-- ---------------------------------------------------------------------------
-- RLS school_support_slots
-- ---------------------------------------------------------------------------
ALTER TABLE school_support_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sss_select_staff" ON school_support_slots;
CREATE POLICY "sss_select_staff"
  ON school_support_slots FOR SELECT
  USING (
    public.is_active_user()
    AND public.is_staff_full()
    AND program_id IN (
      SELECT id FROM school_support_programs WHERE deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "sss_select_parent" ON school_support_slots;
CREATE POLICY "sss_select_parent"
  ON school_support_slots FOR SELECT
  USING (
    public.is_active_user()
    AND public.is_parent()
    AND program_id IN (
      SELECT id FROM school_support_programs
      WHERE deleted_at IS NULL
        AND status = 'OPEN'::school_support_program_status
        AND parent_registration_open = true
    )
  );

DROP POLICY IF EXISTS "sss_insert_staff" ON school_support_slots;
CREATE POLICY "sss_insert_staff"
  ON school_support_slots FOR INSERT
  WITH CHECK (
    public.is_active_user()
    AND public.get_my_role() IN ('ADMIN'::user_role, 'TRAVAILLEUR'::user_role)
  );

DROP POLICY IF EXISTS "sss_update_staff" ON school_support_slots;
CREATE POLICY "sss_update_staff"
  ON school_support_slots FOR UPDATE
  USING (
    public.is_active_user()
    AND public.get_my_role() IN ('ADMIN'::user_role, 'TRAVAILLEUR'::user_role)
  );

DROP POLICY IF EXISTS "sss_delete_staff" ON school_support_slots;
CREATE POLICY "sss_delete_staff"
  ON school_support_slots FOR DELETE
  USING (
    public.is_active_user()
    AND public.get_my_role() IN ('ADMIN'::user_role, 'TRAVAILLEUR'::user_role)
  );

-- ---------------------------------------------------------------------------
-- RLS school_support_enrollments
-- ---------------------------------------------------------------------------
ALTER TABLE school_support_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sse_select_staff" ON school_support_enrollments;
CREATE POLICY "sse_select_staff"
  ON school_support_enrollments FOR SELECT
  USING (public.is_active_user() AND public.is_staff_full());

DROP POLICY IF EXISTS "sse_select_parent" ON school_support_enrollments;
CREATE POLICY "sse_select_parent"
  ON school_support_enrollments FOR SELECT
  USING (
    public.is_active_user()
    AND public.is_parent()
    AND parent_id = auth.uid()
  );

DROP POLICY IF EXISTS "sse_insert_staff" ON school_support_enrollments;
CREATE POLICY "sse_insert_staff"
  ON school_support_enrollments FOR INSERT
  WITH CHECK (
    public.is_active_user()
    AND public.get_my_role() IN ('ADMIN'::user_role, 'TRAVAILLEUR'::user_role)
  );

DROP POLICY IF EXISTS "sse_insert_parent" ON school_support_enrollments;
CREATE POLICY "sse_insert_parent"
  ON school_support_enrollments FOR INSERT
  WITH CHECK (
    public.is_active_user()
    AND public.is_parent()
    AND parent_id = auth.uid()
    AND child_id IN (SELECT public.my_parent_child_ids())
  );

DROP POLICY IF EXISTS "sse_update_staff" ON school_support_enrollments;
CREATE POLICY "sse_update_staff"
  ON school_support_enrollments FOR UPDATE
  USING (
    public.is_active_user()
    AND public.get_my_role() IN ('ADMIN'::user_role, 'TRAVAILLEUR'::user_role)
  );
