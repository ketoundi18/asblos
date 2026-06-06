-- Phase B : rôle PARENT + liens parent ↔ enfant
-- ⚠️ Lance d'abord 007a_parent_enum.sql (seul), puis ce fichier.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS signup_source TEXT DEFAULT 'admin';

CREATE TABLE IF NOT EXISTS parent_child_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  child_id    UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  guardian_id UUID REFERENCES guardians(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (parent_id, child_id)
);

CREATE INDEX IF NOT EXISTS parent_child_links_parent_idx ON parent_child_links(parent_id);
CREATE INDEX IF NOT EXISTS parent_child_links_child_idx ON parent_child_links(child_id);

-- Fonctions rôle parent
CREATE OR REPLACE FUNCTION public.is_parent()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_my_role() = 'PARENT'::user_role;
$$;

CREATE OR REPLACE FUNCTION public.my_verified_child_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT child_id FROM public.parent_child_links
  WHERE parent_id = auth.uid() AND verified_at IS NOT NULL;
$$;

-- Profil : inscription parent forcée en PARENT
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
    assigned_role := COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role,
      'BENEVOLE'::user_role
    );
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

-- Lien auto si e-mail parent = e-mail guardian (validation ASBL requise)
CREATE OR REPLACE FUNCTION public.link_parent_by_guardian_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'PARENT'::user_role AND NEW.email IS NOT NULL THEN
    INSERT INTO public.parent_child_links (parent_id, child_id, guardian_id)
    SELECT NEW.id, g.child_id, g.id
    FROM public.guardians g
    WHERE g.email IS NOT NULL
      AND lower(trim(g.email)) = lower(trim(NEW.email))
    ON CONFLICT (parent_id, child_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_link_parent ON profiles;
CREATE TRIGGER on_profile_link_parent
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.link_parent_by_guardian_email();

-- RLS parent_child_links
ALTER TABLE parent_child_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parent_links_select_own"
  ON parent_child_links FOR SELECT
  USING (parent_id = auth.uid() OR public.is_staff_full());

CREATE POLICY "parent_links_insert_staff"
  ON parent_child_links FOR INSERT
  WITH CHECK (public.is_active_user() AND public.is_staff_full());

CREATE POLICY "parent_links_update_staff"
  ON parent_child_links FOR UPDATE
  USING (public.is_active_user() AND public.is_staff_full());

-- Parents : voir uniquement leurs enfants validés
CREATE POLICY "children_select_parent"
  ON children FOR SELECT
  USING (
    deleted_at IS NULL
    AND public.is_active_user()
    AND public.is_parent()
    AND id IN (SELECT public.my_verified_child_ids())
  );
