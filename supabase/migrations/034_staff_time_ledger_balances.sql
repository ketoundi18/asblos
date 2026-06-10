-- Journal du solde, soldes courants, clôture journalière, vue rapport
-- Prérequis : 031, 032, 033

CREATE TABLE staff_time_balances (
  user_id         UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  balance_minutes INT NOT NULL DEFAULT 0,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE staff_time_balances IS
  'Solde de flexibilité courant (minutes). Recalculable depuis staff_time_ledger.';

CREATE TABLE staff_time_ledger (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kind            staff_time_ledger_kind NOT NULL,
  delta_minutes   INT NOT NULL,
  balance_after   INT NOT NULL,
  reference_date  DATE NOT NULL,
  entry_id        UUID REFERENCES staff_time_entries(id) ON DELETE SET NULL,
  contract_id     UUID REFERENCES staff_time_contracts(id) ON DELETE SET NULL,
  label           TEXT NOT NULL,
  created_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX staff_time_ledger_one_daily_settlement
  ON staff_time_ledger(user_id, reference_date)
  WHERE kind = 'DAILY_SETTLEMENT';

CREATE INDEX staff_time_ledger_user_date_idx
  ON staff_time_ledger(user_id, reference_date DESC);

COMMENT ON TABLE staff_time_ledger IS
  'Mouvements du solde (+/- minutes) avec libellé lisible. Append-only côté app.';

-- Crée la ligne solde à la première session de pointage
CREATE OR REPLACE FUNCTION public.ensure_staff_time_balance_row()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.staff_time_balances (user_id, balance_minutes)
  VALUES (NEW.user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER staff_time_entries_ensure_balance
  AFTER INSERT ON staff_time_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_staff_time_balance_row();

ALTER TABLE staff_time_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_time_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_time_balances_select
  ON staff_time_balances FOR SELECT
  USING (
    public.is_active_user()
    AND (
      user_id = auth.uid()
      OR public.is_staff_time_admin()
    )
  );

CREATE POLICY staff_time_ledger_select
  ON staff_time_ledger FOR SELECT
  USING (
    public.is_active_user()
    AND (
      user_id = auth.uid()
      OR public.is_staff_time_admin()
    )
  );

-- Écriture ledger/balances : service role + RPC SECURITY DEFINER uniquement
GRANT SELECT ON staff_time_balances TO authenticated;
GRANT SELECT ON staff_time_ledger TO authenticated;

-- ---------------------------------------------------------------------------
-- Vue rapport mensuel (heures travaillées)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW staff_monthly_flex_report AS
SELECT
  e.user_id,
  date_trunc(
    'month',
    (e.started_at AT TIME ZONE 'Europe/Brussels')
  )::DATE AS month_start,
  COALESCE(SUM(e.duration_minutes), 0)::INT AS worked_minutes,
  COUNT(*) FILTER (
    WHERE e.status IN ('CLOSED', 'ADJUSTED')
  )::INT AS sessions_count
FROM staff_time_entries e
WHERE e.ended_at IS NOT NULL
GROUP BY
  e.user_id,
  date_trunc('month', (e.started_at AT TIME ZONE 'Europe/Brussels'));

COMMENT ON VIEW staff_monthly_flex_report IS
  'Heures pointées par personne et par mois (fuseau Europe/Brussels).';

GRANT SELECT ON staff_monthly_flex_report TO authenticated;

-- ---------------------------------------------------------------------------
-- Clôture journalière (cron 01h00 ou rattrapage au 1er pointage)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.settle_staff_time_day(
  p_user_id UUID,
  p_reference_date DATE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contract        staff_time_contracts%ROWTYPE;
  v_role            user_role;
  v_worked          INT;
  v_target          INT;
  v_raw_delta       INT;
  v_delta           INT;
  v_tolerance       INT;
  v_balance         INT;
  v_new_balance     INT;
  v_max_credit      INT;
  v_max_debit       INT;
  v_dow             INT;
  v_label           TEXT;
  v_ledger_id       UUID;
  v_worked_label    TEXT;
  v_target_label    TEXT;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM staff_time_ledger
    WHERE user_id = p_user_id
      AND reference_date = p_reference_date
      AND kind = 'DAILY_SETTLEMENT'
  ) THEN
    RETURN NULL;
  END IF;

  SELECT role INTO v_role
  FROM profiles
  WHERE id = p_user_id AND is_active = true;

  IF v_role IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_contract
  FROM staff_time_contracts
  WHERE user_id = p_user_id
    AND valid_from <= p_reference_date
    AND (valid_until IS NULL OR valid_until >= p_reference_date)
  ORDER BY valid_from DESC
  LIMIT 1;

  IF NOT FOUND OR v_contract.period_type <> 'DAILY' THEN
    RETURN NULL;
  END IF;

  v_dow := EXTRACT(ISODOW FROM p_reference_date)::INT;
  IF v_dow = ANY (v_contract.work_days) THEN
    v_target := v_contract.target_minutes;
  ELSE
    v_target := 0;
  END IF;

  SELECT COALESCE(SUM(duration_minutes), 0)::INT INTO v_worked
  FROM staff_time_entries
  WHERE user_id = p_user_id
    AND status IN ('CLOSED', 'ADJUSTED')
    AND (started_at AT TIME ZONE 'Europe/Brussels')::DATE = p_reference_date;

  IF v_target = 0 AND v_worked = 0 THEN
    RETURN NULL;
  END IF;

  v_tolerance := v_contract.tolerance_minutes;
  v_raw_delta := v_worked - v_target;

  IF ABS(v_raw_delta) <= v_tolerance THEN
    v_delta := 0;
  ELSIF v_raw_delta > 0 THEN
    v_delta := v_raw_delta - v_tolerance;
  ELSE
    v_delta := v_raw_delta + v_tolerance;
  END IF;

  IF v_delta = 0 THEN
    RETURN NULL;
  END IF;

  INSERT INTO staff_time_balances (user_id, balance_minutes)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT balance_minutes INTO v_balance
  FROM staff_time_balances
  WHERE user_id = p_user_id
  FOR UPDATE;

  v_max_credit := v_contract.max_credit_minutes;
  v_max_debit := v_contract.max_debit_minutes;
  IF v_role = 'BENEVOLE'::user_role THEN
    v_max_debit := 0;
  END IF;

  v_new_balance := v_balance + v_delta;
  v_new_balance := LEAST(v_new_balance, v_max_credit);
  v_new_balance := GREATEST(v_new_balance, -v_max_debit);

  v_worked_label := (v_worked / 60)::TEXT || 'h' || LPAD((v_worked % 60)::TEXT, 2, '0');
  v_target_label := (v_target / 60)::TEXT || 'h' || LPAD((v_target % 60)::TEXT, 2, '0');

  v_label := format(
    '%s%s min — %s travaillé pour %s objectif (%s)',
    CASE WHEN v_delta >= 0 THEN '+' ELSE '' END,
    v_delta,
    v_worked_label,
    v_target_label,
    to_char(p_reference_date, 'DD/MM/YYYY')
  );

  INSERT INTO staff_time_ledger (
    user_id,
    kind,
    delta_minutes,
    balance_after,
    reference_date,
    contract_id,
    label,
    created_by
  )
  VALUES (
    p_user_id,
    'DAILY_SETTLEMENT',
    v_delta,
    v_new_balance,
    p_reference_date,
    v_contract.id,
    v_label,
    NULL
  )
  RETURNING id INTO v_ledger_id;

  UPDATE staff_time_balances
  SET balance_minutes = v_new_balance, updated_at = now()
  WHERE user_id = p_user_id;

  RETURN v_ledger_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.settle_staff_time_all_for_date(
  p_reference_date DATE DEFAULT (
    (now() AT TIME ZONE 'Europe/Brussels')::DATE - 1
  )
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_count   INT := 0;
BEGIN
  FOR v_user_id IN
    SELECT DISTINCT c.user_id
    FROM staff_time_contracts c
    JOIN profiles p ON p.id = c.user_id AND p.is_active = true
    WHERE c.valid_from <= p_reference_date
      AND (c.valid_until IS NULL OR c.valid_until >= p_reference_date)
      AND p.role IN (
        'TRAVAILLEUR'::user_role,
        'STAGIAIRE'::user_role,
        'BENEVOLE'::user_role
      )
  LOOP
    IF public.settle_staff_time_day(v_user_id, p_reference_date) IS NOT NULL THEN
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.settle_staff_time_day(UUID, DATE) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.settle_staff_time_all_for_date(DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.settle_staff_time_day(UUID, DATE) TO service_role;
GRANT EXECUTE ON FUNCTION public.settle_staff_time_all_for_date(DATE) TO service_role;
