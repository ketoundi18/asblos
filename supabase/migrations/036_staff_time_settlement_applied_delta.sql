-- Correctif M2 : delta ledger = delta réellement appliqué après plafonds crédit/débit
-- Prérequis : 034_staff_time_ledger_balances.sql
--
-- Avant : delta_minutes enregistrait v_delta (pré-plafond) alors que balance_after
--         reflétait le solde plafonné → libellé et mouvement incohérents au cap ±8h/±4h.

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
  v_applied_delta   INT;
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

  v_applied_delta := v_new_balance - v_balance;

  IF v_applied_delta = 0 THEN
    RETURN NULL;
  END IF;

  v_worked_label := (v_worked / 60)::TEXT || 'h' || LPAD((v_worked % 60)::TEXT, 2, '0');
  v_target_label := (v_target / 60)::TEXT || 'h' || LPAD((v_target % 60)::TEXT, 2, '0');

  v_label := format(
    '%s%s min — %s travaillé pour %s objectif (%s)',
    CASE WHEN v_applied_delta >= 0 THEN '+' ELSE '' END,
    v_applied_delta,
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
    v_applied_delta,
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

COMMENT ON FUNCTION public.settle_staff_time_day(UUID, DATE) IS
  'Clôture journalière. delta_minutes = variation réelle après plafonds crédit/débit.';
