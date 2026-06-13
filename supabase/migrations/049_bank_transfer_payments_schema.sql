-- 049 Paiement virement — étape 2 : colonnes, index, RPC, storage
-- Prérequis : 048_bank_transfer_payments.sql (enums MANUAL + PROOF_SUBMITTED)
-- Safe à relancer (IF NOT EXISTS / OR REPLACE)

-- ---------------------------------------------------------------------------
-- 1. Réglages ASBL — coordonnées bancaires
-- ---------------------------------------------------------------------------
ALTER TABLE public.asbl_settings
  ADD COLUMN IF NOT EXISTS bank_iban TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_holder TEXT,
  ADD COLUMN IF NOT EXISTS bank_transfer_instructions TEXT;

COMMENT ON COLUMN public.asbl_settings.bank_iban IS 'IBAN affiché aux parents pour virement';
COMMENT ON COLUMN public.asbl_settings.bank_account_holder IS 'Titulaire du compte bancaire ASBL';
COMMENT ON COLUMN public.asbl_settings.bank_transfer_instructions IS 'Consignes optionnelles (délai, mention, etc.)';

-- ---------------------------------------------------------------------------
-- 2. Paiements — référence virement + preuve
-- ---------------------------------------------------------------------------
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS transfer_reference TEXT,
  ADD COLUMN IF NOT EXISTS proof_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS proof_original_filename TEXT,
  ADD COLUMN IF NOT EXISTS proof_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS proof_rejection_note TEXT;

CREATE INDEX IF NOT EXISTS payments_proof_review_idx
  ON public.payments (proof_submitted_at DESC NULLS LAST)
  WHERE status = 'PROOF_SUBMITTED'::payment_status;

CREATE UNIQUE INDEX IF NOT EXISTS payments_transfer_reference_unique_idx
  ON public.payments (transfer_reference)
  WHERE transfer_reference IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 3. P0 : parent ne peut plus passer en PAYE_EN_ATTENTE_ASBL sans PAID
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_child_enrollment_layer_a_parent(
  p_child_id UUID,
  p_status public.child_enrollment_status
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_membership_status membership_status;
BEGIN
  IF NOT public.is_active_user() OR NOT public.is_parent() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF p_child_id NOT IN (SELECT public.my_parent_child_ids()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF p_status NOT IN (
    'EN_ATTENTE_PAIEMENT'::child_enrollment_status
  ) THEN
    RAISE EXCEPTION 'invalid_status';
  END IF;

  v_membership_status := public.layer_a_to_membership_status(p_status);

  UPDATE public.memberships
  SET
    status = v_membership_status,
    asbl_validated_at = NULL,
    updated_at = now()
  WHERE child_id = p_child_id
    AND school_year = public.current_school_year()
    AND parent_id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.set_child_enrollment_layer_a_parent(UUID, child_enrollment_status) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_child_enrollment_layer_a_parent(UUID, child_enrollment_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_child_enrollment_layer_a_parent(UUID, child_enrollment_status) TO service_role;

-- ---------------------------------------------------------------------------
-- 4. Storage bucket preuves (privé, 5 Mo, PDF/JPEG/PNG)
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs',
  'payment-proofs',
  false,
  5242880,
  ARRAY['application/pdf', 'image/jpeg', 'image/png']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "payment_proofs_select_staff" ON storage.objects;
CREATE POLICY "payment_proofs_select_staff"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'payment-proofs'
    AND public.is_active_user()
    AND public.is_staff_full()
  );

DROP POLICY IF EXISTS "payment_proofs_select_parent" ON storage.objects;
CREATE POLICY "payment_proofs_select_parent"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'payment-proofs'
    AND public.is_active_user()
    AND public.is_parent()
    AND EXISTS (
      SELECT 1
      FROM public.payments p
      WHERE p.parent_id = auth.uid()
        AND p.proof_storage_path = name
    )
  );

DROP POLICY IF EXISTS "payment_proofs_insert_parent" ON storage.objects;
CREATE POLICY "payment_proofs_insert_parent"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'payment-proofs'
    AND public.is_active_user()
    AND public.is_parent()
    AND EXISTS (
      SELECT 1
      FROM public.payments p
      WHERE p.parent_id = auth.uid()
        AND p.id::text = (storage.foldername(name))[1]
        AND p.status IN (
          'PENDING'::payment_status,
          'PROOF_SUBMITTED'::payment_status
        )
    )
  );
