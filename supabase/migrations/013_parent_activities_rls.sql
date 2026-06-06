-- C1 : Parents voient et inscrivent leurs enfants aux activités ouvertes
-- Prérequis : 005, 007, 012
-- Safe à relancer

-- Parents : voir uniquement les activités ouvertes aux parents
DROP POLICY IF EXISTS "activities_select_parent" ON activities;
CREATE POLICY "activities_select_parent"
  ON activities FOR SELECT
  USING (
    deleted_at IS NULL
    AND public.is_active_user()
    AND public.is_parent()
    AND parent_registration_open = true
    AND status IN ('PLANIFIEE'::activity_status, 'EN_COURS'::activity_status)
  );

-- Parents : voir les inscriptions de leurs enfants
DROP POLICY IF EXISTS "registrations_select_parent" ON activity_registrations;
CREATE POLICY "registrations_select_parent"
  ON activity_registrations FOR SELECT
  USING (
    public.is_active_user()
    AND public.is_parent()
    AND child_id IN (SELECT public.my_parent_child_ids())
  );

-- Parents : inscrire un enfant validé à une activité ouverte
DROP POLICY IF EXISTS "registrations_insert_parent" ON activity_registrations;
CREATE POLICY "registrations_insert_parent"
  ON activity_registrations FOR INSERT
  WITH CHECK (
    public.is_active_user()
    AND public.is_parent()
    AND registered_by = auth.uid()
    AND child_id IN (SELECT public.my_verified_child_ids())
    AND EXISTS (
      SELECT 1
      FROM public.activities a
      WHERE a.id = activity_id
        AND a.deleted_at IS NULL
        AND a.parent_registration_open = true
        AND a.status IN ('PLANIFIEE'::activity_status, 'EN_COURS'::activity_status)
    )
  );
