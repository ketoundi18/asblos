-- C1 phase 4 : couche A dérivée depuis memberships quand une ligne existe (lecture)
-- La colonne children.enrollment_status reste en écriture jusqu'au drop final.

CREATE OR REPLACE FUNCTION public.membership_status_to_layer_a(
  p_status membership_status
)
RETURNS child_enrollment_status
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_status
    WHEN 'AWAITING_PAYMENT'::membership_status THEN 'EN_ATTENTE_PAIEMENT'::child_enrollment_status
    WHEN 'AWAITING_ASBL'::membership_status THEN 'PAYE_EN_ATTENTE_ASBL'::child_enrollment_status
    WHEN 'ACTIVE'::membership_status THEN 'VALIDE'::child_enrollment_status
    WHEN 'REJECTED'::membership_status THEN 'REFUSE'::child_enrollment_status
    WHEN 'CANCELLED'::membership_status THEN 'REFUSE'::child_enrollment_status
    ELSE NULL::child_enrollment_status
  END;
$$;

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
  v_school_year                TEXT;
  v_enrollment_status          child_enrollment_status;
  v_enrollment_status_column   child_enrollment_status;
  v_created_via                TEXT;
  v_asbl_validated_at          TIMESTAMPTZ;
  v_mb_id                      UUID;
  v_mb_parent_id               UUID;
  v_mb_plan                    membership_plan;
  v_mb_status                  membership_status;
  v_mb_fee_cents               INT;
  v_mb_asbl_validated_at       TIMESTAMPTZ;
  v_sse_id                     UUID;
  v_sse_status                 school_support_enrollment_status;
  v_sse_program_id             UUID;
  v_link_verified              BOOLEAN;
  v_link_parent_id             UUID;
  v_has_membership             BOOLEAN;
  v_needs_payment              BOOLEAN;
  v_blocks_admin               BOOLEAN;
  v_is_asbl_validated          BOOLEAN;
  v_is_rejected                BOOLEAN;
  v_ss_pending_confirm         BOOLEAN;
  v_is_legacy_pending          BOOLEAN;
  v_effective_status           membership_status;
  v_effective_plan             membership_plan;
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

  SELECT
    c.enrollment_status,
    c.created_via,
    c.asbl_validated_at
  INTO
    v_enrollment_status_column,
    v_created_via,
    v_asbl_validated_at
  FROM public.children c
  WHERE c.id = p_child_id
    AND c.deleted_at IS NULL;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  v_enrollment_status := v_enrollment_status_column;

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

  IF v_has_membership THEN
    v_enrollment_status := COALESCE(
      public.membership_status_to_layer_a(v_mb_status),
      v_enrollment_status_column
    );
    v_asbl_validated_at := COALESCE(v_mb_asbl_validated_at, v_asbl_validated_at);
  END IF;

  SELECT
    sse.id,
    sse.status,
    sse.program_id
  INTO
    v_sse_id,
    v_sse_status,
    v_sse_program_id
  FROM public.school_support_enrollments sse
  WHERE sse.child_id = p_child_id
    AND sse.cancelled_at IS NULL
    AND sse.status IN ('PENDING', 'ACTIVE')
  ORDER BY sse.created_at DESC
  LIMIT 1;

  SELECT
    TRUE,
    pcl.parent_id
  INTO
    v_link_verified,
    v_link_parent_id
  FROM public.parent_child_links pcl
  WHERE pcl.child_id = p_child_id
    AND pcl.verified_at IS NOT NULL
  ORDER BY pcl.verified_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    v_link_verified := FALSE;
    v_link_parent_id := NULL;
  END IF;

  v_effective_status := COALESCE(
    v_mb_status,
    CASE v_enrollment_status_column
      WHEN 'EN_ATTENTE_PAIEMENT' THEN 'AWAITING_PAYMENT'::membership_status
      WHEN 'PAYE_EN_ATTENTE_ASBL' THEN 'AWAITING_ASBL'::membership_status
      WHEN 'VALIDE' THEN 'ACTIVE'::membership_status
      WHEN 'REFUSE' THEN 'REJECTED'::membership_status
      ELSE 'AWAITING_ASBL'::membership_status
    END
  );

  v_effective_plan := v_mb_plan;

  v_needs_payment := CASE
    WHEN v_has_membership THEN
      v_mb_status = 'AWAITING_PAYMENT'::membership_status AND v_mb_fee_cents > 0
    ELSE
      v_enrollment_status_column = 'EN_ATTENTE_PAIEMENT'::child_enrollment_status
  END;

  v_blocks_admin := v_needs_payment
    OR (
      NOT v_has_membership
      AND v_created_via = 'PARENT'
      AND v_enrollment_status_column = 'EN_ATTENTE_PAIEMENT'::child_enrollment_status
    );

  v_is_legacy_pending := NOT v_has_membership
    AND v_enrollment_status_column = 'PAYE_EN_ATTENTE_ASBL'::child_enrollment_status;

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
    NOT v_has_membership AND v_enrollment_status_column = 'VALIDE'::child_enrollment_status
  );

  v_is_rejected := (
    v_has_membership
    AND v_mb_status IN (
      'REJECTED'::membership_status,
      'CANCELLED'::membership_status
    )
  ) OR v_enrollment_status_column = 'REFUSE'::child_enrollment_status;

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

REVOKE ALL ON FUNCTION public.membership_status_to_layer_a(membership_status) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.membership_status_to_layer_a(membership_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.membership_status_to_layer_a(membership_status) TO service_role;

REVOKE ALL ON FUNCTION public.get_child_enrollment_state(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_child_enrollment_state(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_child_enrollment_state(UUID, TEXT) TO service_role;
