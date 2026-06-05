-- Fix connexion : profil manquant + sécurité (RLS) qui bloquait la lecture

-- 1. Crée les profils manquants
INSERT INTO public.profiles (id, email, full_name, role)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  'ADMIN'::user_role
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
);

-- 2. Corrige la règle de sécurité qui bloquait la connexion
DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;

CREATE POLICY "profiles_select_admin"
  ON profiles FOR SELECT
  USING (public.get_my_role() = 'ADMIN'::user_role);
