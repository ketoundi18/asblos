-- P0 — Vérification migrations avant pilote / prod
-- Supabase → SQL Editor → Run → toutes les colonnes doivent être true
-- Vérif complète 029→046 : supabase/INSTALL.md (section « Vérification P0 »)

SELECT
  (SELECT EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema = 'public' AND routine_name = 'get_child_enrollment_state'
  )) AS m040_rpc_ok,
  (SELECT EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema = 'public' AND routine_name = 'upsert_staff_contract'
  )) AS m037_rpc_ok,
  (SELECT NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'children'
      AND column_name = 'enrollment_status'
  )) AS m046_column_dropped,
  (SELECT NOT COALESCE((
    SELECT prosrc LIKE '%enrollment_status%'
    FROM pg_proc
    WHERE proname = 'sync_enrollment_paid'
      AND pronamespace = 'public'::regnamespace
  ), true)) AS sync_enrollment_paid_ok,
  (SELECT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_schema = 'public'
      AND trigger_name = 'staff_time_contracts_updated_at'
  )) AS m032_trigger_ok,
  (SELECT EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema = 'public' AND routine_name = 'layer_a_to_membership_status'
  )) AS m045_rpc_ok,
  (SELECT EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema = 'public' AND routine_name = 'create_parent_enrollment_core'
  )) AS m027_parent_enrollment_ok,
  (SELECT pg_get_functiondef('public.handle_new_user()'::regprocedure)
    LIKE '%signup_not_allowed%') AS m029_handle_new_user_ok;
