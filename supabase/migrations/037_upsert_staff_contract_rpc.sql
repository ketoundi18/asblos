-- H1 : upsert contrat horaire atomique
-- Évite une fenêtre sans contrat actif entre clôture et insertion (race avec cron settlement).
-- Prérequis : 032_staff_time_contracts.sql, 031_staff_time_enums_helpers.sql

CREATE OR REPLACE FUNCTION public.upsert_staff_contract(
  p_user_id UUID,
  p_target_minutes INT,
  p_work_days INT[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today       DATE;
  v_yesterday   DATE;
  v_existing_id UUID;
  v_new_id      UUID;
  v_created_by  UUID := auth.uid();
  v_is_update   BOOLEAN := false;
BEGIN
  IF NOT public.is_staff_time_admin() THEN
    RAISE EXCEPTION 'permission_denied' USING ERRCODE = '42501';
  END IF;

  IF p_target_minutes IS NULL OR p_target_minutes <= 0 THEN
    RAISE EXCEPTION 'invalid_target_minutes' USING ERRCODE = '22023';
  END IF;

  IF p_work_days IS NULL
     OR cardinality(p_work_days) = 0
     OR NOT (p_work_days <@ ARRAY[1, 2, 3, 4, 5, 6, 7]::INT[]) THEN
    RAISE EXCEPTION 'invalid_work_days' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = p_user_id
      AND is_active = true
      AND role IN (
        'TRAVAILLEUR'::user_role,
        'STAGIAIRE'::user_role,
        'BENEVOLE'::user_role
      )
  ) THEN
    RAISE EXCEPTION 'member_not_found' USING ERRCODE = 'P0002';
  END IF;

  v_today := (now() AT TIME ZONE 'Europe/Brussels')::DATE;
  v_yesterday := v_today - 1;

  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::TEXT));

  SELECT id INTO v_existing_id
  FROM staff_time_contracts
  WHERE user_id = p_user_id
    AND valid_until IS NULL
  FOR UPDATE;

  IF v_existing_id IS NOT NULL THEN
    v_is_update := true;
    UPDATE staff_time_contracts
    SET valid_until = v_yesterday,
        updated_at = now()
    WHERE id = v_existing_id;
  END IF;

  INSERT INTO staff_time_contracts (
    user_id,
    period_type,
    target_minutes,
    work_days,
    valid_from,
    tolerance_minutes,
    max_credit_minutes,
    max_debit_minutes,
    created_by
  )
  VALUES (
    p_user_id,
    'DAILY',
    p_target_minutes,
    p_work_days,
    v_today,
    5,
    480,
    240,
    v_created_by
  )
  RETURNING id INTO v_new_id;

  RETURN jsonb_build_object(
    'id', v_new_id,
    'is_update', v_is_update
  );
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_staff_contract(UUID, INT, INT[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_staff_contract(UUID, INT, INT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_staff_contract(UUID, INT, INT[]) TO service_role;

COMMENT ON FUNCTION public.upsert_staff_contract IS
  'Clôture le contrat actif et insère le nouveau en une transaction (admin uniquement).';
