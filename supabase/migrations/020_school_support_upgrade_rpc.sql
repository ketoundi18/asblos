-- Activation soutien scolaire par le parent (contourne les blocages RLS silencieux)
-- Prérequis : 014, 017
-- Safe à relancer

CREATE OR REPLACE FUNCTION public.request_school_support_upgrade(p_child_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parent_id UUID := auth.uid();
  v_school_year TEXT;
  v_fee_cents INT;
  v_new_status membership_status;
  v_new_enrollment child_enrollment_status;
  v_updated INT;
BEGIN
  IF v_parent_id IS NULL OR NOT public.is_active_user() OR NOT public.is_parent() THEN
    RAISE EXCEPTION 'permission_denied';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.parent_child_links pcl
    WHERE pcl.parent_id = v_parent_id
      AND pcl.child_id = p_child_id
      AND pcl.verified_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'link_not_verified';
  END IF;

  v_school_year := public.current_school_year();

  SELECT COALESCE(s.school_support_fee_cents, 0)
  INTO v_fee_cents
  FROM public.asbl_settings s
  WHERE s.school_year = v_school_year
  LIMIT 1;

  v_fee_cents := COALESCE(v_fee_cents, 0);

  IF v_fee_cents > 0 THEN
    v_new_status := 'AWAITING_PAYMENT'::membership_status;
    v_new_enrollment := 'EN_ATTENTE_PAIEMENT'::child_enrollment_status;
  ELSE
    v_new_status := 'AWAITING_ASBL'::membership_status;
    v_new_enrollment := 'PAYE_EN_ATTENTE_ASBL'::child_enrollment_status;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.memberships m
    WHERE m.child_id = p_child_id
      AND m.school_year = v_school_year
      AND m.plan = 'SCHOOL_SUPPORT'::membership_plan
  ) THEN
    RAISE EXCEPTION 'already_school_support';
  END IF;

  UPDATE public.memberships
  SET
    plan = 'SCHOOL_SUPPORT'::membership_plan,
    fee_cents = v_fee_cents,
    status = v_new_status,
    asbl_validated_at = NULL,
    updated_at = now()
  WHERE child_id = p_child_id
    AND parent_id = v_parent_id
    AND school_year = v_school_year
    AND plan = 'BASE'::membership_plan;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated = 0 THEN
    RAISE EXCEPTION 'membership_not_upgradable';
  END IF;

  UPDATE public.children
  SET
    enrollment_status = v_new_enrollment,
    updated_at = now()
  WHERE id = p_child_id
    AND deleted_at IS NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.request_school_support_upgrade(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_school_support_upgrade(UUID) TO authenticated;

-- Policy parent élargie (BASE quel que soit le statut, pas seulement ACTIVE)
DROP POLICY IF EXISTS "memberships_update_parent_upgrade" ON memberships;
CREATE POLICY "memberships_update_parent_upgrade"
  ON memberships FOR UPDATE
  USING (
    public.is_active_user()
    AND public.is_parent()
    AND parent_id = auth.uid()
    AND child_id IN (SELECT public.my_parent_child_ids())
    AND plan = 'BASE'::membership_plan
  )
  WITH CHECK (
    parent_id = auth.uid()
    AND plan = 'SCHOOL_SUPPORT'::membership_plan
    AND status IN (
      'AWAITING_PAYMENT'::membership_status,
      'AWAITING_ASBL'::membership_status
    )
  );

DROP POLICY IF EXISTS "children_update_parent_school_support" ON children;
CREATE POLICY "children_update_parent_school_support"
  ON children FOR UPDATE
  USING (
    public.is_active_user()
    AND public.is_parent()
    AND id IN (SELECT public.my_parent_child_ids())
    AND deleted_at IS NULL
  )
  WITH CHECK (
    id IN (SELECT public.my_parent_child_ids())
    AND enrollment_status IN (
      'EN_ATTENTE_PAIEMENT'::child_enrollment_status,
      'PAYE_EN_ATTENTE_ASBL'::child_enrollment_status
    )
  );
