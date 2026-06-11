-- 047 : handle_new_user parent uniquement — staff créé par l'app (Admin API + profiles)
-- Prérequis : 029 appliquée auparavant
-- Safe à relancer

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
