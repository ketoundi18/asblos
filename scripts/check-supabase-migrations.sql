SELECT
  EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema = 'public' AND routine_name = 'upsert_staff_contract'
  ) AS migration_037_upsert_staff_contract,
  EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_schema = 'public' AND table_name = 'staff_monthly_flex_report'
  ) AS migration_035_monthly_report_view,
  EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema = 'public' AND routine_name = 'settle_staff_time_all_for_date'
  ) AS migration_034_036_settlement_batch
