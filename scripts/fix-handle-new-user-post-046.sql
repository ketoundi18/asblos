-- handle_new_user (029+) — compatible base post-046
-- Supabase → SQL Editor → Run (safe à relancer)
--
-- Accepte les comptes staff créés via Admin API même si signup_source
-- n'est pas encore visible dans raw_app_meta_data (marqueur created_by ou role staff).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta_app JSONB := COALESCE(NEW.raw_app_meta_data, '{}'::jsonb);
  meta_user JSONB := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  user_src TEXT := COALESCE(meta_user->>'signup_source', '');
  app_src TEXT := COALESCE(meta_app->>'signup_source', '');
  invite_role TEXT := COALESCE(meta_app->>'role', meta_user->>'role');
  assigned_role user_role;
  is_staff_admin_create BOOLEAN;
BEGIN
  is_staff_admin_create :=
    app_src IN ('admin', 'staff')
    OR meta_app->>'created_by' = 'asblos_admin'
    OR (
      meta_app ? 'role'
      AND (meta_app->>'role') IN ('ADMIN', 'TRAVAILLEUR', 'BENEVOLE', 'STAGIAIRE')
      AND user_src <> 'parent'
    );

  IF user_src = 'parent' THEN
    assigned_role := 'PARENT'::user_role;
  ELSIF is_staff_admin_create THEN
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
        HINT = 'Inscription publique réservée aux parents (signup_source=parent). Comptes staff : Admin API avec app_metadata signup_source=admin.';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, signup_source, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(meta_user->>'full_name', split_part(NEW.email, '@', 1)),
    assigned_role,
    CASE
      WHEN user_src = 'parent' THEN 'parent'
      ELSE COALESCE(NULLIF(app_src, ''), 'admin')
    END,
    meta_user->>'phone'
  );
  RETURN NEW;
END;
$$;

SELECT pg_get_functiondef('public.handle_new_user()'::regprocedure)
  LIKE '%asblos_admin%' AS handle_new_user_staff_marker_ok;
