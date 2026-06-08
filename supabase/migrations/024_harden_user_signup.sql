-- P0 Sécurité : empêcher l'élévation de rôle à l'inscription Auth
-- Prérequis : 007_parent_role.sql
-- Safe à relancer

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  src TEXT := COALESCE(NEW.raw_user_meta_data->>'signup_source', 'admin');
  assigned_role user_role;
BEGIN
  IF src = 'parent' THEN
    assigned_role := 'PARENT'::user_role;
  ELSE
    -- Ne jamais faire confiance à raw_user_meta_data.role côté client
    assigned_role := 'BENEVOLE'::user_role;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, signup_source, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    assigned_role,
    src,
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$;
