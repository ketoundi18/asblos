-- C1 phase 4 étape B : RLS + trigger sans colonne, puis DROP children.enrollment_status
-- Prérequis : 045
-- Safe à relancer (backfill idempotent)

-- ---------------------------------------------------------------------------
-- 1. Backfill final memberships depuis la colonne legacy (avant drop)
-- ---------------------------------------------------------------------------
INSERT INTO public.memberships (child_id, parent_id, school_year, plan, fee_cents, status, asbl_validated_at)
SELECT
  c.id,
  pcl.parent_id,
  public.current_school_year(),
  CASE
    WHEN c.enrollment_status IN (
      'EN_ATTENTE_PAIEMENT'::child_enrollment_status,
      'PAYE_EN_ATTENTE_ASBL'::child_enrollment_status
    ) THEN 'SCHOOL_SUPPORT'::membership_plan
    ELSE 'BASE'::membership_plan
  END,
  CASE
    WHEN c.enrollment_status = 'EN_ATTENTE_PAIEMENT'::child_enrollment_status THEN
      COALESCE(
        (SELECT s.school_support_fee_cents FROM public.asbl_settings s WHERE s.school_year = public.current_school_year()),
        (SELECT s.enrollment_fee_cents FROM public.asbl_settings s WHERE s.school_year = public.current_school_year()),
        0
      )
    WHEN c.enrollment_status = 'PAYE_EN_ATTENTE_ASBL'::child_enrollment_status THEN
      COALESCE(
        (SELECT s.school_support_fee_cents FROM public.asbl_settings s WHERE s.school_year = public.current_school_year()),
        0
      )
    ELSE 0
  END,
  CASE c.enrollment_status
    WHEN 'EN_ATTENTE_PAIEMENT'::child_enrollment_status THEN 'AWAITING_PAYMENT'::membership_status
    WHEN 'PAYE_EN_ATTENTE_ASBL'::child_enrollment_status THEN 'AWAITING_ASBL'::membership_status
    WHEN 'VALIDE'::child_enrollment_status THEN 'ACTIVE'::membership_status
    WHEN 'REFUSE'::child_enrollment_status THEN 'REJECTED'::membership_status
    ELSE 'AWAITING_ASBL'::membership_status
  END,
  c.asbl_validated_at
FROM public.children c
JOIN public.parent_child_links pcl
  ON pcl.child_id = c.id
 AND pcl.verified_at IS NOT NULL
WHERE c.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.memberships m
    WHERE m.child_id = c.id
      AND m.school_year = public.current_school_year()
  )
ON CONFLICT (child_id, school_year) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. Inférer couche A sans membership (remplace lecture colonne)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.infer_layer_a_without_membership(
  p_child_id UUID,
  p_created_via child_created_via,
  p_asbl_validated_at TIMESTAMPTZ,
  p_link_verified BOOLEAN
)
RETURNS child_enrollment_status
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_asbl_validated_at IS NOT NULL THEN
    RETURN 'VALIDE'::child_enrollment_status;
  END IF;

  IF p_created_via = 'STAFF'::child_created_via THEN
    RETURN 'BROUILLON'::child_enrollment_status;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.memberships m
    WHERE m.child_id = p_child_id
      AND m.school_year = public.current_school_year()
      AND m.status = 'REJECTED'::membership_status
  ) THEN
    RETURN 'REFUSE'::child_enrollment_status;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.payments p
    WHERE p.child_id = p_child_id
      AND p.status = 'PAID'::payment_status
      AND p.purpose = 'MEMBERSHIP'::payment_purpose
  ) THEN
    RETURN 'PAYE_EN_ATTENTE_ASBL'::child_enrollment_status;
  END IF;

  IF p_link_verified THEN
    RETURN 'PAYE_EN_ATTENTE_ASBL'::child_enrollment_status;
  END IF;

  RETURN 'EN_ATTENTE_PAIEMENT'::child_enrollment_status;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. RPC lecture unifiée — sans colonne children.enrollment_status
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_child_enrollment_state(
  p_child_id UUID,
  p_school_year TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_school_year          TEXT;
  v_enrollment_status    child_enrollment_status;
  v_created_via          child_created_via;
  v_asbl_validated_at    TIMESTAMPTZ;
  v_mb_id                UUID;
  v_mb_parent_id         UUID;
  v_mb_plan              membership_plan;
  v_mb_status            membership_status;
  v_mb_fee_cents         INT;
  v_mb_asbl_validated_at TIMESTAMPTZ;
  v_sse_id               UUID;
  v_sse_status           school_support_enrollment_status;
  v_sse_program_id       UUID;
  v_link_verified        BOOLEAN;
  v_link_parent_id       UUID;
  v_has_membership       BOOLEAN;
  v_has_paid_membership  BOOLEAN;
  v_needs_payment        BOOLEAN;
  v_blocks_admin         BOOLEAN;
  v_is_asbl_validated    BOOLEAN;
  v_is_rejected          BOOLEAN;
  v_ss_pending_confirm   BOOLEAN;
  v_is_legacy_pending    BOOLEAN;
  v_effective_status     membership_status;
  v_effective_plan       membership_plan;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_active_user() THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF NOT (
    public.is_staff_full()
    OR public.is_staff_limited()
    OR (
      public.is_parent()
      AND p_child_id IN (SELECT public.my_parent_child_ids())
    )
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  v_school_year := COALESCE(NULLIF(trim(p_school_year), ''), public.current_school_year());

  SELECT c.created_via, c.asbl_validated_at
  INTO v_created_via, v_asbl_validated_at
  FROM public.children c
  WHERE c.id = p_child_id
    AND c.deleted_at IS NULL;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT
    m.id,
    m.parent_id,
    m.plan,
    m.status,
    m.fee_cents,
    m.asbl_validated_at
  INTO
    v_mb_id,
    v_mb_parent_id,
    v_mb_plan,
    v_mb_status,
    v_mb_fee_cents,
    v_mb_asbl_validated_at
  FROM public.memberships m
  WHERE m.child_id = p_child_id
    AND m.school_year = v_school_year;

  v_has_membership := v_mb_id IS NOT NULL;

  SELECT
    TRUE,
    pcl.parent_id
  INTO v_link_verified, v_link_parent_id
  FROM public.parent_child_links pcl
  WHERE pcl.child_id = p_child_id
    AND pcl.verified_at IS NOT NULL
  ORDER BY pcl.verified_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    v_link_verified := FALSE;
    v_link_parent_id := NULL;
  END IF;

  v_has_paid_membership := EXISTS (
    SELECT 1
    FROM public.payments p
    WHERE p.child_id = p_child_id
      AND p.status = 'PAID'::payment_status
      AND p.purpose = 'MEMBERSHIP'::payment_purpose
  );

  IF v_has_membership THEN
    v_enrollment_status := public.membership_status_to_layer_a(v_mb_status);
    v_asbl_validated_at := COALESCE(v_mb_asbl_validated_at, v_asbl_validated_at);
  ELSE
    v_enrollment_status := public.infer_layer_a_without_membership(
      p_child_id,
      v_created_via,
      v_asbl_validated_at,
      COALESCE(v_link_verified, FALSE)
    );
  END IF;

  SELECT sse.id, sse.status, sse.program_id
  INTO v_sse_id, v_sse_status, v_sse_program_id
  FROM public.school_support_enrollments sse
  WHERE sse.child_id = p_child_id
    AND sse.cancelled_at IS NULL
    AND sse.status IN ('PENDING', 'ACTIVE')
  ORDER BY sse.created_at DESC
  LIMIT 1;

  v_effective_status := COALESCE(
    v_mb_status,
    public.layer_a_to_membership_status(v_enrollment_status)
  );

  v_effective_plan := v_mb_plan;

  v_needs_payment := CASE
    WHEN v_has_membership THEN
      v_mb_status = 'AWAITING_PAYMENT'::membership_status AND v_mb_fee_cents > 0
    ELSE
      v_enrollment_status = 'EN_ATTENTE_PAIEMENT'::child_enrollment_status
  END;

  v_blocks_admin := v_needs_payment
    OR (
      NOT v_has_membership
      AND v_created_via = 'PARENT'::child_created_via
      AND v_enrollment_status = 'EN_ATTENTE_PAIEMENT'::child_enrollment_status
    );

  v_is_legacy_pending := NOT v_has_membership
    AND v_enrollment_status = 'PAYE_EN_ATTENTE_ASBL'::child_enrollment_status
    AND (
      v_has_paid_membership
      OR COALESCE(v_link_verified, FALSE)
    );

  v_ss_pending_confirm := (
    v_has_membership
    AND v_mb_plan = 'SCHOOL_SUPPORT'::membership_plan
    AND (
      v_mb_status = 'AWAITING_ASBL'::membership_status
      OR (
        v_mb_status = 'AWAITING_PAYMENT'::membership_status
        AND v_mb_fee_cents <= 0
      )
    )
  ) OR v_is_legacy_pending;

  v_is_asbl_validated := (
    v_has_membership AND v_mb_status = 'ACTIVE'::membership_status
  ) OR (
    NOT v_has_membership AND v_enrollment_status = 'VALIDE'::child_enrollment_status
  );

  v_is_rejected := (
    v_has_membership
    AND v_mb_status IN (
      'REJECTED'::membership_status,
      'CANCELLED'::membership_status
    )
  ) OR v_enrollment_status = 'REFUSE'::child_enrollment_status;

  RETURN jsonb_build_object(
    'child_id', p_child_id,
    'school_year', v_school_year,
    'layer_a', jsonb_build_object(
      'enrollment_status', v_enrollment_status,
      'created_via', v_created_via,
      'asbl_validated_at', v_asbl_validated_at
    ),
    'layer_b', CASE
      WHEN v_has_membership THEN jsonb_build_object(
        'membership_id', v_mb_id,
        'parent_id', v_mb_parent_id,
        'plan', v_mb_plan,
        'status', v_mb_status,
        'fee_cents', v_mb_fee_cents,
        'asbl_validated_at', v_mb_asbl_validated_at
      )
      ELSE NULL
    END,
    'layer_c', CASE
      WHEN v_sse_id IS NOT NULL THEN jsonb_build_object(
        'enrollment_id', v_sse_id,
        'status', v_sse_status,
        'program_id', v_sse_program_id
      )
      ELSE NULL
    END,
    'link', jsonb_build_object(
      'verified', COALESCE(v_link_verified, FALSE),
      'parent_id', v_link_parent_id
    ),
    'derived', jsonb_build_object(
      'has_membership', v_has_membership,
      'needs_payment', v_needs_payment,
      'blocks_admin_validation', v_blocks_admin,
      'is_asbl_validated', v_is_asbl_validated,
      'is_rejected', v_is_rejected,
      'is_school_support_pending_confirm', v_ss_pending_confirm,
      'is_legacy_pending_asbl', v_is_legacy_pending,
      'has_program_enrollment', v_sse_id IS NOT NULL,
      'has_pending_program_enrollment', v_sse_status = 'PENDING'::school_support_enrollment_status,
      'has_active_program_enrollment', v_sse_status = 'ACTIVE'::school_support_enrollment_status,
      'effective_plan', v_effective_plan,
      'effective_membership_status', v_effective_status
    )
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. Trigger lien parent vérifié — sans colonne legacy
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ensure_membership_for_verified_link()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_child       public.children%ROWTYPE;
  v_school_year TEXT;
  v_support_fee INT;
  v_plan        membership_plan;
  v_status      membership_status;
  v_fee         INT;
BEGIN
  IF NEW.verified_at IS NULL THEN
    RETURN NEW;
  END IF;

  v_school_year := public.current_school_year();

  IF EXISTS (
    SELECT 1
    FROM public.memberships m
    WHERE m.child_id = NEW.child_id
      AND m.school_year = v_school_year
  ) THEN
    RETURN NEW;
  END IF;

  SELECT *
  INTO v_child
  FROM public.children c
  WHERE c.id = NEW.child_id
    AND c.deleted_at IS NULL;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(s.school_support_fee_cents, s.enrollment_fee_cents, 0)
  INTO v_support_fee
  FROM public.asbl_settings s
  WHERE s.school_year = v_school_year;

  v_support_fee := COALESCE(v_support_fee, 0);

  IF EXISTS (
    SELECT 1
    FROM public.payments p
    WHERE p.child_id = NEW.child_id
      AND p.status = 'PAID'::payment_status
      AND p.purpose = 'MEMBERSHIP'::payment_purpose
  ) THEN
    v_plan := 'SCHOOL_SUPPORT'::membership_plan;
    v_status := 'AWAITING_ASBL'::membership_status;
    v_fee := v_support_fee;
  ELSIF v_child.asbl_validated_at IS NOT NULL THEN
    v_plan := 'BASE'::membership_plan;
    v_status := 'ACTIVE'::membership_status;
    v_fee := 0;
  ELSIF v_support_fee > 0 THEN
    v_plan := 'SCHOOL_SUPPORT'::membership_plan;
    v_status := 'AWAITING_PAYMENT'::membership_status;
    v_fee := v_support_fee;
  ELSE
    v_plan := 'SCHOOL_SUPPORT'::membership_plan;
    v_status := 'AWAITING_ASBL'::membership_status;
    v_fee := 0;
  END IF;

  INSERT INTO public.memberships (
    child_id,
    parent_id,
    school_year,
    plan,
    fee_cents,
    status,
    asbl_validated_at
  ) VALUES (
    NEW.child_id,
    NEW.parent_id,
    v_school_year,
    v_plan,
    v_fee,
    v_status,
    CASE WHEN v_status = 'ACTIVE'::membership_status THEN v_child.asbl_validated_at ELSE NULL END
  )
  ON CONFLICT (child_id, school_year) DO NOTHING;

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 5. Helpers RLS parent — sans enrollment_status
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.my_editable_parent_enrollment_child_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id
  FROM public.children c
  WHERE c.deleted_at IS NULL
    AND c.created_by = auth.uid()
    AND c.created_via = 'PARENT'::child_created_via
    AND c.asbl_validated_at IS NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.memberships m
      WHERE m.child_id = c.id
        AND m.school_year = public.current_school_year()
        AND m.status IN (
          'REJECTED'::membership_status,
          'ACTIVE'::membership_status
        )
    );
$$;

CREATE OR REPLACE FUNCTION public.my_parent_child_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pcl.child_id
  FROM public.parent_child_links pcl
  WHERE pcl.parent_id = auth.uid()
    AND pcl.verified_at IS NOT NULL
  UNION
  SELECT c.id
  FROM public.children c
  WHERE c.deleted_at IS NULL
    AND c.created_by = auth.uid()
    AND c.created_via = 'PARENT'::child_created_via
    AND c.asbl_validated_at IS NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.memberships m
      WHERE m.child_id = c.id
        AND m.school_year = public.current_school_year()
        AND m.status = 'REJECTED'::membership_status
    );
$$;

-- ---------------------------------------------------------------------------
-- 6. Policies RLS — sans enrollment_status
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "children_insert_parent" ON public.children;
CREATE POLICY "children_insert_parent"
  ON public.children FOR INSERT
  WITH CHECK (
    public.is_active_user()
    AND public.is_parent()
    AND created_by = auth.uid()
    AND created_via = 'PARENT'::child_created_via
    AND deleted_at IS NULL
  );

DROP POLICY IF EXISTS "children_update_parent" ON public.children;
CREATE POLICY "children_update_parent"
  ON public.children FOR UPDATE
  USING (
    public.is_active_user()
    AND public.is_parent()
    AND id IN (SELECT public.my_editable_parent_enrollment_child_ids())
  )
  WITH CHECK (
    created_by = auth.uid()
    AND created_via = 'PARENT'::child_created_via
    AND asbl_validated_at IS NULL
    AND (
      NOT EXISTS (
        SELECT 1
        FROM public.memberships m
        WHERE m.child_id = children.id
          AND m.school_year = public.current_school_year()
      )
      OR EXISTS (
        SELECT 1
        FROM public.memberships m
        WHERE m.child_id = children.id
          AND m.school_year = public.current_school_year()
          AND m.status = 'AWAITING_PAYMENT'::membership_status
      )
    )
  );

-- ---------------------------------------------------------------------------
-- 7. Staff draft / layer A — sans colonne
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_child_enrollment_layer_a_staff(
  p_child_id UUID,
  p_status public.child_enrollment_status,
  p_verified_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_membership_status membership_status;
  v_updated           INT;
BEGIN
  IF NOT public.is_active_user() OR NOT public.is_staff_full() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF p_status = 'BROUILLON'::child_enrollment_status THEN
    UPDATE public.children
    SET asbl_validated_at = NULL, updated_at = now()
    WHERE id = p_child_id AND deleted_at IS NULL;

    DELETE FROM public.memberships
    WHERE child_id = p_child_id
      AND school_year = public.current_school_year()
      AND status IN (
        'AWAITING_PAYMENT'::membership_status,
        'AWAITING_ASBL'::membership_status
      );
    RETURN;
  END IF;

  v_membership_status := public.layer_a_to_membership_status(p_status);

  IF v_membership_status IS NOT NULL THEN
    UPDATE public.memberships
    SET
      status = v_membership_status,
      asbl_validated_at = CASE
        WHEN v_membership_status = 'ACTIVE'::membership_status THEN p_verified_at
        ELSE NULL
      END,
      updated_at = now()
    WHERE child_id = p_child_id
      AND school_year = public.current_school_year();

    GET DIAGNOSTICS v_updated = ROW_COUNT;
  END IF;

  UPDATE public.children
  SET
    asbl_validated_at = CASE
      WHEN p_status = 'VALIDE'::child_enrollment_status THEN p_verified_at
      ELSE NULL
    END,
    updated_at = now()
  WHERE id = p_child_id
    AND deleted_at IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.reset_child_enrollment_draft_staff(
  p_child_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_active_user() OR NOT public.is_staff_full() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE public.children
  SET asbl_validated_at = NULL, updated_at = now()
  WHERE id = p_child_id
    AND deleted_at IS NULL;

  DELETE FROM public.memberships
  WHERE child_id = p_child_id
    AND school_year = public.current_school_year()
    AND status IN (
      'AWAITING_PAYMENT'::membership_status,
      'AWAITING_ASBL'::membership_status
    );
END;
$$;

-- ---------------------------------------------------------------------------
-- 8. DROP colonne legacy
-- ---------------------------------------------------------------------------
DROP INDEX IF EXISTS public.children_enrollment_status_idx;
ALTER TABLE public.children DROP COLUMN IF EXISTS enrollment_status;

REVOKE ALL ON FUNCTION public.infer_layer_a_without_membership(UUID, child_created_via, TIMESTAMPTZ, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.infer_layer_a_without_membership(UUID, child_created_via, TIMESTAMPTZ, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.infer_layer_a_without_membership(UUID, child_created_via, TIMESTAMPTZ, BOOLEAN) TO service_role;

REVOKE ALL ON FUNCTION public.get_child_enrollment_state(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_child_enrollment_state(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_child_enrollment_state(UUID, TEXT) TO service_role;
