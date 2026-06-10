-- C1 phase 3 lot 2 : transitions staff (couche A, et A+B pour activation soutien)

CREATE OR REPLACE FUNCTION public.set_child_enrollment_layer_a_staff(
  p_child_id UUID,
  p_status public.child_enrollment_status,
  p_verified_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_active_user() OR NOT public.is_staff_full() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE public.children
  SET
    enrollment_status = p_status,
    asbl_validated_at = CASE
      WHEN p_status = 'VALIDE'::child_enrollment_status THEN p_verified_at
      ELSE NULL
    END,
    updated_at = now()
  WHERE id = p_child_id
    AND deleted_at IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.activate_child_enrollment_staff(
  p_child_id UUID,
  p_verified_at TIMESTAMPTZ,
  p_school_year TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_active_user() OR NOT public.is_staff_full() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE public.children
  SET
    enrollment_status = 'VALIDE'::child_enrollment_status,
    asbl_validated_at = p_verified_at,
    updated_at = now()
  WHERE id = p_child_id
    AND deleted_at IS NULL;

  UPDATE public.memberships
  SET
    status = 'ACTIVE'::membership_status,
    asbl_validated_at = p_verified_at,
    updated_at = now()
  WHERE child_id = p_child_id
    AND school_year = p_school_year
    AND status IN (
      'AWAITING_ASBL'::membership_status,
      'AWAITING_PAYMENT'::membership_status
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.reset_child_enrollment_draft_staff(
  p_child_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_active_user() OR NOT public.is_staff_full() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE public.children
  SET
    enrollment_status = 'BROUILLON'::child_enrollment_status,
    asbl_validated_at = NULL,
    updated_at = now()
  WHERE id = p_child_id
    AND deleted_at IS NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.set_child_enrollment_layer_a_staff(UUID, public.child_enrollment_status, TIMESTAMPTZ) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.activate_child_enrollment_staff(UUID, TIMESTAMPTZ, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reset_child_enrollment_draft_staff(UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.set_child_enrollment_layer_a_staff(UUID, public.child_enrollment_status, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.activate_child_enrollment_staff(UUID, TIMESTAMPTZ, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_child_enrollment_draft_staff(UUID) TO authenticated;

GRANT EXECUTE ON FUNCTION public.set_child_enrollment_layer_a_staff(UUID, public.child_enrollment_status, TIMESTAMPTZ) TO service_role;
GRANT EXECUTE ON FUNCTION public.activate_child_enrollment_staff(UUID, TIMESTAMPTZ, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.reset_child_enrollment_draft_staff(UUID) TO service_role;
