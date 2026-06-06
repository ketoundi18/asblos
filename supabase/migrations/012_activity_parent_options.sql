-- C0 : options activité — tarif + ouverture aux parents
-- Prérequis : 005_activities.sql
-- Safe à relancer

ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS price_cents INT NOT NULL DEFAULT 0
    CHECK (price_cents >= 0),
  ADD COLUMN IF NOT EXISTS parent_registration_open BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN activities.price_cents IS '0 = gratuit, >0 = payant (centimes EUR)';
COMMENT ON COLUMN activities.parent_registration_open IS 'Si true, visible et inscriptible par les parents (futur espace parent)';

CREATE INDEX IF NOT EXISTS activities_parent_open_idx
  ON activities(parent_registration_open)
  WHERE deleted_at IS NULL AND parent_registration_open = true;
