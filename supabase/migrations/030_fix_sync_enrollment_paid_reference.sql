-- Fix sync_enrollment_paid : reference_id est UUID, pas TEXT (migration 027)
-- Erreur prod/dev : operator does not exist: uuid = text (42883)

CREATE OR REPLACE FUNCTION public.sync_enrollment_paid(
  p_child_id UUID,
  p_membership_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.payments p
    WHERE p.child_id = p_child_id
      AND p.status = 'PAID'::payment_status
      AND (
        p_membership_id IS NULL
        OR p.reference_id = p_membership_id
      )
  ) THEN
    RAISE EXCEPTION 'payment_not_confirmed';
  END IF;

  UPDATE public.children
  SET
    enrollment_status = 'PAYE_EN_ATTENTE_ASBL'::child_enrollment_status,
    updated_at = now()
  WHERE id = p_child_id
    AND deleted_at IS NULL;

  IF p_membership_id IS NOT NULL THEN
    UPDATE public.memberships
    SET
      status = 'AWAITING_ASBL'::membership_status,
      updated_at = now()
    WHERE id = p_membership_id
      AND child_id = p_child_id
      AND status = 'AWAITING_PAYMENT'::membership_status;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_enrollment_paid(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_enrollment_paid(UUID, UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.sync_enrollment_paid(UUID, UUID) TO service_role;
