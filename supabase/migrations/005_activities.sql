-- Module 3 : Activités, inscriptions et présences

CREATE TYPE activity_status AS ENUM (
  'PLANIFIEE',
  'EN_COURS',
  'TERMINEE',
  'ANNULEE'
);

CREATE TABLE activities (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             TEXT NOT NULL,
  description       TEXT,
  activity_date     DATE NOT NULL,
  start_time        TIME,
  end_time          TIME,
  location          TEXT,
  max_participants  INT,
  status            activity_status NOT NULL DEFAULT 'PLANIFIEE',
  created_by        UUID REFERENCES profiles(id),
  updated_by        UUID REFERENCES profiles(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ
);

CREATE TABLE activity_registrations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id   UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  child_id      UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  registered_by UUID REFERENCES profiles(id),
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  cancelled_at  TIMESTAMPTZ,
  UNIQUE (activity_id, child_id)
);

CREATE TABLE activity_attendance (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  child_id    UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  is_present  BOOLEAN NOT NULL,
  notes       TEXT,
  marked_by   UUID REFERENCES profiles(id),
  marked_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (activity_id, child_id)
);

CREATE INDEX activities_date_idx ON activities(activity_date);
CREATE INDEX activities_status_idx ON activities(status);
CREATE INDEX activities_deleted_at_idx ON activities(deleted_at);
CREATE INDEX activity_registrations_activity_idx ON activity_registrations(activity_id);
CREATE INDEX activity_registrations_child_idx ON activity_registrations(child_id);
CREATE INDEX activity_attendance_activity_idx ON activity_attendance(activity_id);

CREATE TRIGGER activities_updated_at
  BEFORE UPDATE ON activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS activities
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activities_select_staff"
  ON activities FOR SELECT
  USING (deleted_at IS NULL AND public.is_active_user());

CREATE POLICY "activities_insert_staff"
  ON activities FOR INSERT
  WITH CHECK (
    public.is_active_user()
    AND public.get_my_role() IN ('ADMIN', 'TRAVAILLEUR')
  );

CREATE POLICY "activities_update_staff"
  ON activities FOR UPDATE
  USING (
    deleted_at IS NULL
    AND public.is_active_user()
    AND public.get_my_role() IN ('ADMIN', 'TRAVAILLEUR')
  );

-- RLS inscriptions
ALTER TABLE activity_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "registrations_select_staff"
  ON activity_registrations FOR SELECT
  USING (public.is_active_user());

CREATE POLICY "registrations_insert_staff"
  ON activity_registrations FOR INSERT
  WITH CHECK (
    public.is_active_user()
    AND public.get_my_role() IN ('ADMIN', 'TRAVAILLEUR', 'STAGIAIRE')
  );

CREATE POLICY "registrations_update_staff"
  ON activity_registrations FOR UPDATE
  USING (
    public.is_active_user()
    AND public.get_my_role() IN ('ADMIN', 'TRAVAILLEUR', 'STAGIAIRE')
  );

-- RLS présences (tous les rôles actifs)
ALTER TABLE activity_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attendance_select_staff"
  ON activity_attendance FOR SELECT
  USING (public.is_active_user());

CREATE POLICY "attendance_insert_staff"
  ON activity_attendance FOR INSERT
  WITH CHECK (public.is_active_user());

CREATE POLICY "attendance_update_staff"
  ON activity_attendance FOR UPDATE
  USING (public.is_active_user());
