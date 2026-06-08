-- Permet au staff de créer une adhésion lors de l'inscription manuelle d'un enfant
-- Prérequis : 014_memberships_v2.sql

DROP POLICY IF EXISTS "memberships_insert_staff" ON memberships;
CREATE POLICY "memberships_insert_staff"
  ON memberships FOR INSERT
  WITH CHECK (public.is_active_user() AND public.is_staff_full());
