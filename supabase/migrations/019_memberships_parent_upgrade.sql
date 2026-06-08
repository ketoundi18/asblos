-- Parent : peut passer de BASE/ACTIVE à SCHOOL_SUPPORT (activation soutien scolaire)
-- Prérequis : 014, 017
-- Safe à relancer

DROP POLICY IF EXISTS "memberships_update_parent_upgrade" ON memberships;
CREATE POLICY "memberships_update_parent_upgrade"
  ON memberships FOR UPDATE
  USING (
    public.is_active_user()
    AND public.is_parent()
    AND parent_id = auth.uid()
    AND child_id IN (SELECT public.my_parent_child_ids())
    AND plan = 'BASE'::membership_plan
    AND status = 'ACTIVE'::membership_status
  )
  WITH CHECK (
    parent_id = auth.uid()
    AND plan = 'SCHOOL_SUPPORT'::membership_plan
    AND status IN (
      'AWAITING_PAYMENT'::membership_status,
      'AWAITING_ASBL'::membership_status
    )
  );

-- Parent : peut marquer l'enfant lié (staff) en attente soutien scolaire
DROP POLICY IF EXISTS "children_update_parent_school_support" ON children;
CREATE POLICY "children_update_parent_school_support"
  ON children FOR UPDATE
  USING (
    public.is_active_user()
    AND public.is_parent()
    AND id IN (SELECT public.my_parent_child_ids())
    AND deleted_at IS NULL
  )
  WITH CHECK (
    id IN (SELECT public.my_parent_child_ids())
    AND enrollment_status IN (
      'EN_ATTENTE_PAIEMENT'::child_enrollment_status,
      'PAYE_EN_ATTENTE_ASBL'::child_enrollment_status
    )
  );
