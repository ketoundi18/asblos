-- C1 phase 3 : transitions admin atomiques (couche A + B)
-- Remplace les double-writes TS dans enrollment-writes.ts (validate / reject / confirm soutien)

CREATE OR REPLACE FUNCTION public.activate_child_enrollment_admin(
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
  IF NOT public.is_active_user()
    OR public.get_my_role() != 'ADMIN'::user_role
  THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE public.children
  SET
    enrollment_status = 'VALIDE'::child_enrollment_status,
    asbl_validated_at = p_verified_at,
    updated_at = now()
  WHERE id = p_child_id
    AND created_via = 'PARENT'::child_created_via
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

CREATE OR REPLACE FUNCTION public.reject_child_enrollment_admin(
  p_child_id UUID,
  p_school_year TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_active_user()
    OR public.get_my_role() != 'ADMIN'::user_role
  THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE public.children
  SET
    enrollment_status = 'REFUSE'::child_enrollment_status,
    updated_at = now()
  WHERE id = p_child_id
    AND created_via = 'PARENT'::child_created_via
    AND deleted_at IS NULL;

  UPDATE public.memberships
  SET
    status = 'REJECTED'::membership_status,
    updated_at = now()
  WHERE child_id = p_child_id
    AND school_year = p_school_year;
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_child_enrollment_validated(
  p_child_id UUID,
  p_verified_at TIMESTAMPTZ
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_active_user()
    OR public.get_my_role() != 'ADMIN'::user_role
  THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE public.children
  SET
    enrollment_status = 'VALIDE'::child_enrollment_status,
    asbl_validated_at = p_verified_at,
    updated_at = now()
  WHERE id = p_child_id
    AND deleted_at IS NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.activate_child_enrollment_admin(UUID, TIMESTAMPTZ, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reject_child_enrollment_admin(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.confirm_child_enrollment_validated(UUID, TIMESTAMPTZ) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.activate_child_enrollment_admin(UUID, TIMESTAMPTZ, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_child_enrollment_admin(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_child_enrollment_validated(UUID, TIMESTAMPTZ) TO authenticated;

GRANT EXECUTE ON FUNCTION public.activate_child_enrollment_admin(UUID, TIMESTAMPTZ, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.reject_child_enrollment_admin(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.confirm_child_enrollment_validated(UUID, TIMESTAMPTZ) TO service_role;
