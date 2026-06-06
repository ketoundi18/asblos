-- v2 : paiements liés à un objectif (adhésion ou activité)
-- Prérequis : 014_memberships_v2.sql
-- Safe à relancer

DO $$ BEGIN
  CREATE TYPE payment_purpose AS ENUM ('MEMBERSHIP', 'ACTIVITY');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS purpose payment_purpose,
  ADD COLUMN IF NOT EXISTS reference_id UUID;

CREATE INDEX IF NOT EXISTS payments_purpose_ref_idx
  ON payments(purpose, reference_id)
  WHERE reference_id IS NOT NULL;

-- Un seul paiement PAID par adhésion / inscription activité
CREATE UNIQUE INDEX IF NOT EXISTS payments_one_paid_per_reference
  ON payments(purpose, reference_id)
  WHERE status = 'PAID'::payment_status
    AND reference_id IS NOT NULL
    AND purpose IS NOT NULL;

-- Rattacher les paiements existants aux memberships (meilleur effort)
UPDATE payments p
SET
  purpose = 'MEMBERSHIP'::payment_purpose,
  reference_id = m.id
FROM memberships m
WHERE p.purpose IS NULL
  AND p.child_id = m.child_id
  AND m.school_year = public.current_school_year();
