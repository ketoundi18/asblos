-- C1 phase 4 prep : transition couche A pour le parent (création inscription)

CREATE OR REPLACE FUNCTION public.set_child_enrollment_layer_a_parent(
  p_child_id UUID,
  p_status public.child_enrollment_status
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_active_user() OR NOT public.is_parent() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF p_child_id NOT IN (SELECT public.my_parent_child_ids()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF p_status NOT IN (
    'EN_ATTENTE_PAIEMENT'::child_enrollment_status,
    'PAYE_EN_ATTENTE_ASBL'::child_enrollment_status
  ) THEN
    RAISE EXCEPTION 'invalid_status';
  END IF;

  UPDATE public.children
  SET
    enrollment_status = p_status,
    asbl_validated_at = NULL,
    updated_at = now()
  WHERE id = p_child_id
    AND deleted_at IS NULL
    AND created_via = 'PARENT'::child_created_via;
END;
$$;

REVOKE ALL ON FUNCTION public.set_child_enrollment_layer_a_parent(UUID, public.child_enrollment_status) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_child_enrollment_layer_a_parent(UUID, public.child_enrollment_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_child_enrollment_layer_a_parent(UUID, public.child_enrollment_status) TO service_role;

COMMENT ON COLUMN public.children.enrollment_status IS
  'DEPRECATED C1 — couche A legacy. Source cible : memberships + RPC get_child_enrollment_state. Suppression prévue phase 4.';
