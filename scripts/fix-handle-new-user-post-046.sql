-- handle_new_user (029) — compatible base post-046 (sans enrollment_status)
-- Supabase → SQL Editor → Run
-- Safe à relancer

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_src TEXT := COALESCE(NEW.raw_user_meta_data->>'signup_source', '');
  app_src TEXT := COALESCE(NEW.raw_app_meta_data->>'signup_source', '');
  invite_role TEXT := NEW.raw_app_meta_data->>'role';
  assigned_role user_role;
BEGIN
  IF user_src = 'parent' THEN
    assigned_role := 'PARENT'::user_role;
  ELSIF app_src IN ('admin', 'staff') THEN
    BEGIN
      assigned_role := COALESCE(
        invite_role::user_role,
        'BENEVOLE'::user_role
      );
    EXCEPTION
      WHEN invalid_text_representation THEN
        assigned_role := 'BENEVOLE'::user_role;
    END;
  ELSE
    RAISE EXCEPTION 'signup_not_allowed'
      USING
        HINT = 'Inscription publique réservée aux parents (signup_source=parent). Comptes staff : création admin avec app_metadata signup_source=admin.';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, signup_source, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    assigned_role,
    CASE WHEN user_src = 'parent' THEN 'parent' ELSE app_src END,
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$;

-- Vérification
SELECT pg_get_functiondef('public.handle_new_user()'::regprocedure)
  LIKE '%signup_not_allowed%' AS migration_029_ok;
