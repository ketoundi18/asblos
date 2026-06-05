-- Module 2 : Fiches enfants + parents/tuteurs

CREATE TYPE child_status AS ENUM ('ACTIF', 'INACTIF', 'ARCHIVE');

CREATE TYPE guardian_relation AS ENUM ('MERE', 'PERE', 'TUTEUR', 'AUTRE');

CREATE TABLE children (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name              TEXT NOT NULL,
  last_name               TEXT NOT NULL,
  birth_date              DATE NOT NULL,
  school_name             TEXT,
  school_class            TEXT,
  allergies               TEXT,
  medical_notes           TEXT,
  image_rights            BOOLEAN NOT NULL DEFAULT false,
  image_rights_date       DATE,
  outing_authorization    BOOLEAN NOT NULL DEFAULT false,
  outing_auth_date        DATE,
  emergency_contact_name  TEXT,
  emergency_contact_phone TEXT,
  notes                   TEXT,
  status                  child_status NOT NULL DEFAULT 'ACTIF',
  created_by              UUID REFERENCES profiles(id),
  updated_by              UUID REFERENCES profiles(id),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ,
  anonymized_at           TIMESTAMPTZ
);

CREATE TABLE guardians (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id    UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  relation    guardian_relation NOT NULL,
  first_name  TEXT NOT NULL,
  last_name   TEXT NOT NULL,
  email       TEXT,
  phone       TEXT NOT NULL,
  is_primary  BOOLEAN NOT NULL DEFAULT false,
  can_pickup  BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX children_status_idx ON children(status);
CREATE INDEX children_last_name_idx ON children(last_name);
CREATE INDEX children_deleted_at_idx ON children(deleted_at);
CREATE INDEX guardians_child_id_idx ON guardians(child_id);

CREATE TRIGGER children_updated_at
  BEFORE UPDATE ON children
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER guardians_updated_at
  BEFORE UPDATE ON guardians
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS children
ALTER TABLE children ENABLE ROW LEVEL SECURITY;

CREATE POLICY "children_select_staff"
  ON children FOR SELECT
  USING (
    deleted_at IS NULL
    AND public.is_active_user()
  );

CREATE POLICY "children_insert_staff"
  ON children FOR INSERT
  WITH CHECK (
    public.is_active_user()
    AND public.get_my_role() IN ('ADMIN', 'TRAVAILLEUR')
  );

CREATE POLICY "children_update_staff"
  ON children FOR UPDATE
  USING (
    deleted_at IS NULL
    AND public.is_active_user()
    AND public.get_my_role() IN ('ADMIN', 'TRAVAILLEUR', 'STAGIAIRE')
  );

-- RLS guardians
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guardians_select_staff"
  ON guardians FOR SELECT
  USING (
    public.is_active_user()
    AND EXISTS (
      SELECT 1 FROM children c
      WHERE c.id = guardians.child_id AND c.deleted_at IS NULL
    )
  );

CREATE POLICY "guardians_insert_staff"
  ON guardians FOR INSERT
  WITH CHECK (
    public.is_active_user()
    AND public.get_my_role() IN ('ADMIN', 'TRAVAILLEUR', 'STAGIAIRE')
    AND EXISTS (
      SELECT 1 FROM children c
      WHERE c.id = guardians.child_id AND c.deleted_at IS NULL
    )
  );

CREATE POLICY "guardians_update_staff"
  ON guardians FOR UPDATE
  USING (
    public.is_active_user()
    AND public.get_my_role() IN ('ADMIN', 'TRAVAILLEUR', 'STAGIAIRE')
  );

CREATE POLICY "guardians_delete_staff"
  ON guardians FOR DELETE
  USING (
    public.is_active_user()
    AND public.get_my_role() IN ('ADMIN', 'TRAVAILLEUR', 'STAGIAIRE')
  );
