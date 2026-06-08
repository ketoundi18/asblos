-- Report bienveillant : inscription activité sans blocage paiement
-- Prérequis : 005, 012, 013

DO $$ BEGIN
  CREATE TYPE activity_registration_payment_status AS ENUM (
    'NOT_REQUIRED',
    'PENDING',
    'DEFERRED',
    'PAID',
    'WAIVED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE activity_registrations
  ADD COLUMN IF NOT EXISTS payment_status activity_registration_payment_status NOT NULL DEFAULT 'NOT_REQUIRED';

COMMENT ON COLUMN activity_registrations.payment_status IS
  'NOT_REQUIRED=gratuit | DEFERRED=report parent | PENDING=payer bientôt | PAID | WAIVED=ASBL';
