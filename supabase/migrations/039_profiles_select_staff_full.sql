-- GO F : permettre ADMIN + TRAVAILLEUR de lire les profils via le client authentifié
-- (remplace createStaffReadClient / service role pour la file soutien scolaire).

DROP POLICY IF EXISTS "profiles_select_staff_full" ON public.profiles;

CREATE POLICY "profiles_select_staff_full"
  ON public.profiles FOR SELECT
  USING (
    public.is_active_user()
    AND public.is_staff_full()
  );
