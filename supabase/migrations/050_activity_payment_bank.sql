-- 050 Coordonnées virement par activité payante
-- Prérequis : 048, 049
-- Safe à relancer

ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS payment_bank_iban TEXT,
  ADD COLUMN IF NOT EXISTS payment_bank_account_holder TEXT,
  ADD COLUMN IF NOT EXISTS payment_transfer_reference TEXT;

COMMENT ON COLUMN public.activities.payment_bank_iban IS 'IBAN pour le virement de cette activité';
COMMENT ON COLUMN public.activities.payment_bank_account_holder IS 'Titulaire du compte pour cette activité';
COMMENT ON COLUMN public.activities.payment_transfer_reference IS 'Communication structurée à indiquer au virement';
