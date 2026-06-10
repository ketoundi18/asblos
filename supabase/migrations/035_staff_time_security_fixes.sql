-- Correctifs sécurité staff time (audit P2, P3)
-- Prérequis : 033, 034
-- À appliquer après 034 dans Supabase SQL Editor.

-- ---------------------------------------------------------------------------
-- P2 : fermeture pointage — le staff ne peut que CLOSED + ended_at
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS staff_time_entries_update_own_close ON staff_time_entries;

CREATE POLICY staff_time_entries_update_own_close
  ON staff_time_entries FOR UPDATE
  USING (
    public.is_staff_clockable()
    AND user_id = auth.uid()
    AND status = 'OPEN'
  )
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'CLOSED'
    AND ended_at IS NOT NULL
  );

-- ---------------------------------------------------------------------------
-- P3 : vue rapport mensuel — security_barrier + filtre auth.uid() / admin
-- ---------------------------------------------------------------------------
REVOKE ALL ON staff_monthly_flex_report FROM PUBLIC;
REVOKE ALL ON staff_monthly_flex_report FROM authenticated;
REVOKE ALL ON staff_monthly_flex_report FROM anon;

DROP VIEW IF EXISTS staff_monthly_flex_report;

CREATE VIEW staff_monthly_flex_report
WITH (security_barrier = true)
AS
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
  AND (
    e.user_id = auth.uid()
    OR public.is_staff_time_admin()
  )
GROUP BY
  e.user_id,
  date_trunc('month', (e.started_at AT TIME ZONE 'Europe/Brussels'));

COMMENT ON VIEW staff_monthly_flex_report IS
  'Heures pointées par personne/mois. RLS implicite : soi ou admin.';

GRANT SELECT ON staff_monthly_flex_report TO authenticated;

-- ---------------------------------------------------------------------------
-- P6 : clôture journalière des soldes (cron)
-- Planifier dans Supabase Dashboard → Database → Extensions → pg_cron
-- ou Edge Function + cron externe (01:00 Europe/Brussels) :
--
--   SELECT public.settle_staff_time_all_for_date(
--     ((now() AT TIME ZONE 'Europe/Brussels')::DATE - 1)
--   );
--
-- Exécuter avec le rôle service_role (pas depuis le client anon).
