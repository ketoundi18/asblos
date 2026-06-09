-- P0-B : Inscription Auth strictement parent + RLS enfant lié vérifié
-- Prérequis : 024, 011 (à corriger), 010
-- Safe à relancer
--
-- Problèmes corrigés :
-- 1. Signup public sans signup_source=parent → compte BENEVOLE avec accès staff RLS
-- 2. Migration 011 : parent voyait tout enfant lié sans verified_at (données médicales)
--
-- Comptes staff : créer via Supabase Dashboard ou Admin API avec app_metadata :
--   {"signup_source":"admin","role":"ADMIN"}
-- (raw_app_meta_data — non modifiable par le client anon)

-- ---------------------------------------------------------------------------
-- 1. handle_new_user : parent (user_metadata) ou staff (app_metadata admin)
-- ---------------------------------------------------------------------------
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
    assigned_role := COALESCE(
      invite_role::user_role,
      'BENEVOLE'::user_role
    );
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

-- ---------------------------------------------------------------------------
-- 2. my_parent_child_ids : liens vérifiés + inscriptions parent en cours
--    (pas les liens auto guardian e-mail non validés par l''ASBL)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.my_parent_child_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pcl.child_id
  FROM public.parent_child_links pcl
  WHERE pcl.parent_id = auth.uid()
    AND pcl.verified_at IS NOT NULL
  UNION
  SELECT c.id
  FROM public.children c
  WHERE c.deleted_at IS NULL
    AND c.created_by = auth.uid()
    AND c.created_via = 'PARENT'::child_created_via
    AND c.asbl_validated_at IS NULL
    AND c.enrollment_status <> 'REFUSE'::child_enrollment_status;
$$;

-- ---------------------------------------------------------------------------
-- 3. children_select_parent : uniquement enfants liés ET vérifiés par l''ASBL
--    (inscriptions en cours : policy children_select_parent_created — 010)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "children_select_parent" ON children;

CREATE POLICY "children_select_parent"
  ON children FOR SELECT
  USING (
    deleted_at IS NULL
    AND public.is_active_user()
    AND public.is_parent()
    AND id IN (SELECT public.my_verified_child_ids())
  );

-- ---------------------------------------------------------------------------
-- 4. guardians parent : liens vérifiés ou fiche en cours d''inscription
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "guardians_select_parent" ON guardians;

CREATE POLICY "guardians_select_parent"
  ON guardians FOR SELECT
  USING (
    public.is_active_user()
    AND public.is_parent()
    AND (
      child_id IN (SELECT public.my_verified_child_ids())
      OR child_id IN (SELECT public.my_editable_parent_enrollment_child_ids())
    )
  );
