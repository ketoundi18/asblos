-- Réparation Phase A : relance ce script si tu as une Internal Server Error
-- Safe à relancer plusieurs fois (IF EXISTS / OR REPLACE)

CREATE OR REPLACE FUNCTION public.is_staff_full()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_my_role() IN ('ADMIN'::user_role, 'TRAVAILLEUR'::user_role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff_limited()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_my_role() IN ('BENEVOLE'::user_role, 'STAGIAIRE'::user_role);
$$;

-- children
DROP POLICY IF EXISTS "children_select_staff" ON children;
DROP POLICY IF EXISTS "children_select_full" ON children;
DROP POLICY IF EXISTS "children_select_limited" ON children;
DROP POLICY IF EXISTS "children_update_staff" ON children;

CREATE POLICY "children_select_full"
  ON children FOR SELECT
  USING (
    deleted_at IS NULL
    AND public.is_active_user()
    AND public.is_staff_full()
  );

CREATE POLICY "children_select_limited"
  ON children FOR SELECT
  USING (
    deleted_at IS NULL
    AND public.is_active_user()
    AND public.is_staff_limited()
  );

CREATE POLICY "children_update_staff"
  ON children FOR UPDATE
  USING (
    deleted_at IS NULL
    AND public.is_active_user()
    AND public.is_staff_full()
  );

-- guardians
DROP POLICY IF EXISTS "guardians_select_staff" ON guardians;
DROP POLICY IF EXISTS "guardians_select_limited" ON guardians;
DROP POLICY IF EXISTS "guardians_insert_staff" ON guardians;
DROP POLICY IF EXISTS "guardians_update_staff" ON guardians;
DROP POLICY IF EXISTS "guardians_delete_staff" ON guardians;

CREATE POLICY "guardians_select_staff"
  ON guardians FOR SELECT
  USING (
    public.is_active_user()
    AND public.is_staff_full()
    AND EXISTS (
      SELECT 1 FROM children c
      WHERE c.id = guardians.child_id AND c.deleted_at IS NULL
    )
  );

CREATE POLICY "guardians_select_limited"
  ON guardians FOR SELECT
  USING (
    public.is_active_user()
    AND public.is_staff_limited()
    AND EXISTS (
      SELECT 1 FROM children c
      WHERE c.id = guardians.child_id AND c.deleted_at IS NULL
    )
  );

CREATE POLICY "guardians_insert_staff"
  ON guardians FOR INSERT
  WITH CHECK (
    public.is_active_user()
    AND public.is_staff_full()
    AND EXISTS (
      SELECT 1 FROM children c
      WHERE c.id = guardians.child_id AND c.deleted_at IS NULL
    )
  );

CREATE POLICY "guardians_update_staff"
  ON guardians FOR UPDATE
  USING (public.is_active_user() AND public.is_staff_full());

CREATE POLICY "guardians_delete_staff"
  ON guardians FOR DELETE
  USING (public.is_active_user() AND public.is_staff_full());

-- inscriptions activités (seulement si Module 3 déjà installé)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'activity_registrations'
  ) THEN
    DROP POLICY IF EXISTS "registrations_insert_staff" ON activity_registrations;
    DROP POLICY IF EXISTS "registrations_update_staff" ON activity_registrations;

    CREATE POLICY "registrations_insert_staff"
      ON activity_registrations FOR INSERT
      WITH CHECK (public.is_active_user() AND public.is_staff_full());

    CREATE POLICY "registrations_update_staff"
      ON activity_registrations FOR UPDATE
      USING (public.is_active_user() AND public.is_staff_full());
  END IF;
END $$;
