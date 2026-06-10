-- Objectifs horaires par membre staff (contrat de flexibilité)
-- Prérequis : 031_staff_time_enums_helpers.sql

CREATE TABLE staff_time_contracts (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period_type        staff_time_period NOT NULL DEFAULT 'DAILY',
  target_minutes     INT NOT NULL,
  work_days          INT[] NOT NULL DEFAULT '{1,2,3,4,5}',
  valid_from         DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until        DATE,
  tolerance_minutes  INT NOT NULL DEFAULT 5,
  max_credit_minutes INT NOT NULL DEFAULT 480,
  max_debit_minutes  INT NOT NULL DEFAULT 240,
  created_by         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT staff_time_contracts_target_positive CHECK (target_minutes > 0),
  CONSTRAINT staff_time_contracts_tolerance_nonneg CHECK (tolerance_minutes >= 0),
  CONSTRAINT staff_time_contracts_max_credit_positive CHECK (max_credit_minutes > 0),
  CONSTRAINT staff_time_contracts_max_debit_positive CHECK (max_debit_minutes >= 0),
  CONSTRAINT staff_time_contracts_work_days_valid CHECK (
    work_days <@ ARRAY[1, 2, 3, 4, 5, 6, 7]::INT[]
    AND cardinality(work_days) > 0
  ),
  CONSTRAINT staff_time_contracts_valid_range CHECK (
    valid_until IS NULL OR valid_until >= valid_from
  )
);

CREATE UNIQUE INDEX staff_time_contracts_one_active_per_user
  ON staff_time_contracts(user_id)
  WHERE valid_until IS NULL;

CREATE INDEX staff_time_contracts_user_valid_idx
  ON staff_time_contracts(user_id, valid_from DESC);

COMMENT ON TABLE staff_time_contracts IS
  'Objectif horaire (ex. 285 min = 4h45/jour). Un seul contrat actif (valid_until NULL) par personne.';
COMMENT ON COLUMN staff_time_contracts.work_days IS
  'Jours ISO : 1=lundi … 7=dimanche (EXTRACT(ISODOW FROM date)).';

CREATE TRIGGER staff_time_contracts_updated_at
  BEFORE UPDATE ON staff_time_contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE staff_time_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_time_contracts_select_own
  ON staff_time_contracts FOR SELECT
  USING (
    public.is_active_user()
    AND (
      user_id = auth.uid()
      OR public.is_staff_time_admin()
    )
  );

CREATE POLICY staff_time_contracts_insert_admin
  ON staff_time_contracts FOR INSERT
  WITH CHECK (public.is_staff_time_admin());

CREATE POLICY staff_time_contracts_update_admin
  ON staff_time_contracts FOR UPDATE
  USING (public.is_staff_time_admin())
  WITH CHECK (public.is_staff_time_admin());

CREATE POLICY staff_time_contracts_delete_admin
  ON staff_time_contracts FOR DELETE
  USING (public.is_staff_time_admin());

GRANT SELECT ON staff_time_contracts TO authenticated;
GRANT INSERT, UPDATE, DELETE ON staff_time_contracts TO authenticated;
