-- Pointages réels (Commencer / Terminer mon service)
-- Prérequis : 031_staff_time_enums_helpers.sql

CREATE TABLE staff_time_entries (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at         TIMESTAMPTZ,
  duration_minutes INT GENERATED ALWAYS AS (
    CASE
      WHEN ended_at IS NOT NULL THEN
        GREATEST(0, (EXTRACT(EPOCH FROM (ended_at - started_at)) / 60)::INT)
      ELSE NULL
    END
  ) STORED,
  status           staff_time_entry_status NOT NULL DEFAULT 'OPEN',
  note             TEXT,
  adjusted_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  adjusted_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT staff_time_entries_end_after_start CHECK (
    ended_at IS NULL OR ended_at > started_at
  ),
  CONSTRAINT staff_time_entries_open_no_end CHECK (
    status <> 'OPEN' OR ended_at IS NULL
  ),
  CONSTRAINT staff_time_entries_closed_has_end CHECK (
    status = 'OPEN' OR ended_at IS NOT NULL
  )
);

CREATE UNIQUE INDEX staff_time_entries_one_open_per_user
  ON staff_time_entries(user_id)
  WHERE ended_at IS NULL AND status = 'OPEN';

CREATE INDEX staff_time_entries_user_started_idx
  ON staff_time_entries(user_id, started_at DESC);

CREATE INDEX staff_time_entries_started_brussels_date_idx
  ON staff_time_entries(
    user_id,
    ((started_at AT TIME ZONE 'Europe/Brussels')::DATE)
  );

COMMENT ON TABLE staff_time_entries IS
  'Sessions de pointage staff. Une seule session OPEN par personne.';

ALTER TABLE staff_time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_time_entries_select
  ON staff_time_entries FOR SELECT
  USING (
    public.is_active_user()
    AND (
      user_id = auth.uid()
      OR public.is_staff_time_admin()
    )
  );

CREATE POLICY staff_time_entries_insert_own
  ON staff_time_entries FOR INSERT
  WITH CHECK (
    public.is_staff_clockable()
    AND user_id = auth.uid()
    AND status = 'OPEN'
    AND ended_at IS NULL
  );

CREATE POLICY staff_time_entries_update_own_close
  ON staff_time_entries FOR UPDATE
  USING (
    public.is_staff_clockable()
    AND user_id = auth.uid()
    AND status = 'OPEN'
  )
  WITH CHECK (
    user_id = auth.uid()
    AND status IN ('OPEN', 'CLOSED')
  );

CREATE POLICY staff_time_entries_update_admin
  ON staff_time_entries FOR UPDATE
  USING (public.is_staff_time_admin())
  WITH CHECK (public.is_staff_time_admin());

GRANT SELECT, INSERT, UPDATE ON staff_time_entries TO authenticated;
