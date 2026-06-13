-- 051 Paiement virement — confirmation atomique staff + anti-doublon
-- Prérequis : 049_bank_transfer_payments_schema.sql

-- ---------------------------------------------------------------------------
-- 1. Un seul paiement ouvert par enfant / objet (cotisation ou inscription activité)
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS payments_open_duplicate_guard_idx
  ON public.payments (child_id, purpose, reference_id)
  WHERE status IN (
    'PENDING'::payment_status,
    'PROOF_SUBMITTED'::payment_status
  )
    AND reference_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. Confirmer preuve : PAID + sync adhésion ou activité (transaction unique)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.confirm_bank_transfer_payment(p_payment_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment public.payments%ROWTYPE;
  v_rows INTEGER;
BEGIN
  SELECT *
  INTO v_payment
  FROM public.payments
  WHERE id = p_payment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found';
  END IF;

  IF v_payment.status = 'PAID'::payment_status THEN
    RETURN;
  END IF;

  IF v_payment.status <> 'PROOF_SUBMITTED'::payment_status THEN
    RAISE EXCEPTION 'proof_not_submitted';
  END IF;

  UPDATE public.payments
  SET
    status = 'PAID'::payment_status,
    paid_at = now(),
    proof_rejection_note = NULL
  WHERE id = p_payment_id;

  IF v_payment.purpose = 'MEMBERSHIP'::payment_purpose THEN
    PERFORM public.sync_enrollment_paid(
      v_payment.child_id,
      v_payment.reference_id
    );
  ELSIF v_payment.purpose = 'ACTIVITY'::payment_purpose THEN
    UPDATE public.activity_registrations
    SET payment_status = 'PAID'::activity_registration_payment_status
    WHERE id = v_payment.reference_id
      AND payment_status IN (
        'PENDING'::activity_registration_payment_status,
        'DEFERRED'::activity_registration_payment_status
      );

    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows = 0 THEN
      RAISE EXCEPTION 'activity_registration_not_updated';
    END IF;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_bank_transfer_payment(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.confirm_bank_transfer_payment(UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_bank_transfer_payment(UUID) TO service_role;
