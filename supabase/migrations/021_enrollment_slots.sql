-- Créneaux choisis à l'inscription + statut PENDING sur les inscriptions soutien
-- Prérequis : 017_school_support_module.sql
-- Safe à relancer

ALTER TYPE school_support_enrollment_status ADD VALUE IF NOT EXISTS 'PENDING';

-- ---------------------------------------------------------------------------
-- school_support_enrollment_slots — jours/créneaux souhaités par l'enfant
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS school_support_enrollment_slots (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES school_support_enrollments(id) ON DELETE CASCADE,
  slot_id       UUID NOT NULL REFERENCES school_support_slots(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (enrollment_id, slot_id)
);

CREATE INDEX IF NOT EXISTS school_support_enrollment_slots_enrollment_idx
  ON school_support_enrollment_slots(enrollment_id);

CREATE INDEX IF NOT EXISTS school_support_enrollment_slots_slot_idx
  ON school_support_enrollment_slots(slot_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE school_support_enrollment_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sses_select_staff" ON school_support_enrollment_slots;
CREATE POLICY "sses_select_staff"
  ON school_support_enrollment_slots FOR SELECT
  USING (public.is_active_user() AND public.is_staff_full());

DROP POLICY IF EXISTS "sses_select_parent" ON school_support_enrollment_slots;
CREATE POLICY "sses_select_parent"
  ON school_support_enrollment_slots FOR SELECT
  USING (
    public.is_active_user()
    AND public.is_parent()
    AND enrollment_id IN (
      SELECT id FROM school_support_enrollments
      WHERE parent_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "sses_insert_parent" ON school_support_enrollment_slots;
CREATE POLICY "sses_insert_parent"
  ON school_support_enrollment_slots FOR INSERT
  WITH CHECK (
    public.is_active_user()
    AND public.is_parent()
    AND enrollment_id IN (
      SELECT id FROM school_support_enrollments
      WHERE parent_id = auth.uid()
        AND child_id IN (SELECT public.my_parent_child_ids())
    )
    AND slot_id IN (
      SELECT sss.id
      FROM school_support_slots sss
      JOIN school_support_enrollments sse ON sse.program_id = sss.program_id
      WHERE sse.id = enrollment_id
    )
  );

DROP POLICY IF EXISTS "sses_insert_staff" ON school_support_enrollment_slots;
CREATE POLICY "sses_insert_staff"
  ON school_support_enrollment_slots FOR INSERT
  WITH CHECK (
    public.is_active_user()
    AND public.get_my_role() IN ('ADMIN'::user_role, 'TRAVAILLEUR'::user_role)
  );
