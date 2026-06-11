-- handle_new_user — parent uniquement (compatible post-046)
-- Supabase → SQL Editor → Run (safe à relancer)
--
-- Les comptes staff sont créés par l'app (Admin API + insert profiles service role).
-- Ce trigger ne gère QUE l'inscription parent publique (signup_source=parent).
-- Il ne bloque plus signup_not_allowed → la création Auth staff ne peut plus échouer ici.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_src TEXT := COALESCE(NEW.raw_user_meta_data->>'signup_source', '');
BEGIN
  IF user_src = 'parent' THEN
    INSERT INTO public.profiles (id, email, full_name, role, signup_source, phone)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      'PARENT'::user_role,
      'parent',
      NEW.raw_user_meta_data->>'phone'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Vérification : plus de signup_not_allowed, branche parent présente
SELECT
  pg_get_functiondef('public.handle_new_user()'::regprocedure)
    LIKE '%signup_source%parent%' AS handle_new_user_parent_only_ok,
  pg_get_functiondef('public.handle_new_user()'::regprocedure)
    NOT LIKE '%signup_not_allowed%' AS handle_new_user_no_staff_block_ok;
