-- Module Horaires & pointage — enums et helpers RLS
-- Prérequis : 001_profiles.sql, 006_align_staff_roles.sql
-- Phase 1 — compte de flexibilité horaire (cadrage validé phase 0)

CREATE TYPE staff_time_period AS ENUM ('DAILY', 'WEEKLY');

CREATE TYPE staff_time_entry_status AS ENUM ('OPEN', 'CLOSED', 'ADJUSTED');

CREATE TYPE staff_time_ledger_kind AS ENUM (
  'DAILY_SETTLEMENT',
  'WEEKLY_SETTLEMENT',
  'MANUAL_ADJUSTMENT',
  'RECOVERY_REQUEST',
  'PERIOD_RESET'
);

COMMENT ON TYPE staff_time_period IS
  'DAILY = objectif par jour (V1). WEEKLY = clôture hebdo (V2).';

-- TRAVAILLEUR, STAGIAIRE, BENEVOLE — peuvent pointer (pas ADMIN en V1)
CREATE OR REPLACE FUNCTION public.is_staff_clockable()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_active_user()
    AND public.get_my_role() IN (
      'TRAVAILLEUR'::user_role,
      'STAGIAIRE'::user_role,
      'BENEVOLE'::user_role
    );
$$;

CREATE OR REPLACE FUNCTION public.is_staff_time_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_active_user()
    AND public.get_my_role() = 'ADMIN'::user_role;
$$;

REVOKE ALL ON FUNCTION public.is_staff_clockable() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_staff_clockable() TO authenticated;

REVOKE ALL ON FUNCTION public.is_staff_time_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_staff_time_admin() TO authenticated;
