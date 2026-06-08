-- Journal d'audit append-only (RGPD, traçabilité actions sensibles)
-- Prérequis : 001_profiles.sql
-- Safe à relancer

CREATE TABLE IF NOT EXISTS logs_audit (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  actor_role  TEXT,
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   UUID NOT NULL,
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_hash     TEXT,
  CONSTRAINT logs_audit_metadata_object CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE INDEX IF NOT EXISTS logs_audit_occurred_at_idx ON logs_audit(occurred_at DESC);
CREATE INDEX IF NOT EXISTS logs_audit_entity_idx ON logs_audit(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS logs_audit_action_idx ON logs_audit(action);
CREATE INDEX IF NOT EXISTS logs_audit_actor_idx ON logs_audit(actor_id) WHERE actor_id IS NOT NULL;

COMMENT ON TABLE logs_audit IS
  'Journal append-only : validation enfant, paiements, réglages ASBL. Pas de UPDATE/DELETE.';

-- ---------------------------------------------------------------------------
-- RLS : lecture ADMIN uniquement — écriture via service role (Server Actions)
-- ---------------------------------------------------------------------------
ALTER TABLE logs_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "logs_audit_select_admin" ON logs_audit;
CREATE POLICY "logs_audit_select_admin"
  ON logs_audit FOR SELECT
  USING (
    public.is_active_user()
    AND public.get_my_role() = 'ADMIN'::user_role
  );

-- Pas de policy INSERT/UPDATE/DELETE pour authenticated :
-- seul le service role (createAdminClient) peut insérer.

-- Bloque l'accès direct à la table pour anon/authenticated (RLS + pas de GRANT INSERT)
REVOKE ALL ON logs_audit FROM anon;
GRANT SELECT ON logs_audit TO authenticated;
