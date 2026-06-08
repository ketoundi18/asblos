-- P0 Sécurité : paiements, statuts enfant, soutien scolaire (liens vérifiés)
-- Prérequis : 014, 017, 019, 020, 021
-- Safe à relancer

-- ---------------------------------------------------------------------------
-- 1. Parents ne modifient plus le statut/plan des adhésions directement
--    (transitions via webhook Mollie + service role, RPC, ou staff)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "memberships_update_parent_payment" ON memberships;
DROP POLICY IF EXISTS "memberships_update_parent_upgrade" ON memberships;

-- ---------------------------------------------------------------------------
-- 2. Parents ne peuvent pas marquer eux-mêmes « payé en attente ASBL »
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "children_update_parent_school_support" ON children;

DROP POLICY IF EXISTS "children_update_parent" ON children;
CREATE POLICY "children_update_parent"
  ON children FOR UPDATE
  USING (
    public.is_active_user()
    AND public.is_parent()
    AND id IN (SELECT public.my_editable_parent_enrollment_child_ids())
  )
  WITH CHECK (
    created_by = auth.uid()
    AND created_via = 'PARENT'::child_created_via
    AND asbl_validated_at IS NULL
    AND enrollment_status IN (
      'BROUILLON'::child_enrollment_status,
      'EN_ATTENTE_PAIEMENT'::child_enrollment_status
    )
  );

-- ---------------------------------------------------------------------------
-- 3. Soutien scolaire parent : lien vérifié OU inscription PENDING à la création
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "sse_insert_parent" ON school_support_enrollments;
CREATE POLICY "sse_insert_parent"
  ON school_support_enrollments FOR INSERT
  WITH CHECK (
    public.is_active_user()
    AND public.is_parent()
    AND parent_id = auth.uid()
    AND (
      child_id IN (SELECT public.my_verified_child_ids())
      OR (
        status = 'PENDING'::school_support_enrollment_status
        AND child_id IN (
          SELECT c.id
          FROM public.children c
          WHERE c.deleted_at IS NULL
            AND c.created_via = 'PARENT'::child_created_via
            AND c.created_by = auth.uid()
            AND c.id IN (SELECT public.my_parent_child_ids())
        )
      )
    )
  );

DROP POLICY IF EXISTS "sse_select_parent" ON school_support_enrollments;
CREATE POLICY "sse_select_parent"
  ON school_support_enrollments FOR SELECT
  USING (
    public.is_active_user()
    AND public.is_parent()
    AND parent_id = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- 4. Créneaux soutien : alignés sur inscriptions parent autorisées
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "sses_insert_parent" ON school_support_enrollment_slots;
CREATE POLICY "sses_insert_parent"
  ON school_support_enrollment_slots FOR INSERT
  WITH CHECK (
    public.is_active_user()
    AND public.is_parent()
    AND enrollment_id IN (
      SELECT sse.id
      FROM public.school_support_enrollments sse
      WHERE sse.parent_id = auth.uid()
        AND (
          sse.child_id IN (SELECT public.my_verified_child_ids())
          OR (
            sse.status = 'PENDING'::school_support_enrollment_status
            AND sse.child_id IN (
              SELECT c.id
              FROM public.children c
              WHERE c.deleted_at IS NULL
                AND c.created_via = 'PARENT'::child_created_via
                AND c.created_by = auth.uid()
            )
          )
        )
    )
    AND slot_id IN (
      SELECT sss.id
      FROM public.school_support_slots sss
      JOIN public.school_support_enrollments sse ON sse.program_id = sss.program_id
      WHERE sse.id = enrollment_id
    )
  );

-- ---------------------------------------------------------------------------
-- 5. Index webhook / sync paiements
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS payments_provider_payment_id_idx
  ON payments(provider_payment_id)
  WHERE provider_payment_id IS NOT NULL;
