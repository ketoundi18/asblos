-- C1 phase 4 étape A : arrêter le double-write sur children.enrollment_status
-- La colonne reste pour RLS / brouillon staff jusqu'à l'étape B (drop).

CREATE OR REPLACE FUNCTION public.layer_a_to_membership_status(
  p_status child_enrollment_status
)
RETURNS membership_status
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_status
    WHEN 'EN_ATTENTE_PAIEMENT'::child_enrollment_status THEN 'AWAITING_PAYMENT'::membership_status
    WHEN 'PAYE_EN_ATTENTE_ASBL'::child_enrollment_status THEN 'AWAITING_ASBL'::membership_status
    WHEN 'VALIDE'::child_enrollment_status THEN 'ACTIVE'::membership_status
    WHEN 'REFUSE'::child_enrollment_status THEN 'REJECTED'::membership_status
    ELSE NULL::membership_status
  END;
$$;

-- ---------------------------------------------------------------------------
-- Admin transitions (041) — memberships + asbl_validated_at seulement
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.activate_child_enrollment_admin(
  p_child_id UUID,
  p_verified_at TIMESTAMPTZ,
  p_school_year TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_active_user()
    OR public.get_my_role() != 'ADMIN'::user_role
  THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE public.children
  SET
    asbl_validated_at = p_verified_at,
    updated_at = now()
  WHERE id = p_child_id
    AND created_via = 'PARENT'::child_created_via
    AND deleted_at IS NULL;

  UPDATE public.memberships
  SET
    status = 'ACTIVE'::membership_status,
    asbl_validated_at = p_verified_at,
    updated_at = now()
  WHERE child_id = p_child_id
    AND school_year = p_school_year
    AND status IN (
      'AWAITING_ASBL'::membership_status,
      'AWAITING_PAYMENT'::membership_status
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_child_enrollment_admin(
  p_child_id UUID,
  p_school_year TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_active_user()
    OR public.get_my_role() != 'ADMIN'::user_role
  THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE public.memberships
  SET
    status = 'REJECTED'::membership_status,
    updated_at = now()
  WHERE child_id = p_child_id
    AND school_year = p_school_year;
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_child_enrollment_validated(
  p_child_id UUID,
  p_verified_at TIMESTAMPTZ
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_active_user()
    OR public.get_my_role() != 'ADMIN'::user_role
  THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE public.children
  SET
    asbl_validated_at = p_verified_at,
    updated_at = now()
  WHERE id = p_child_id
    AND deleted_at IS NULL;
END;
$$;

-- ---------------------------------------------------------------------------
-- Staff transitions (042)
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
    SET
      enrollment_status = 'BROUILLON'::child_enrollment_status,
      asbl_validated_at = NULL,
      updated_at = now()
    WHERE id = p_child_id
      AND deleted_at IS NULL;
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

  IF COALESCE(v_updated, 0) = 0 AND v_membership_status IS NOT NULL THEN
    UPDATE public.children
    SET
      enrollment_status = p_status,
      asbl_validated_at = CASE
        WHEN p_status = 'VALIDE'::child_enrollment_status THEN p_verified_at
        ELSE NULL
      END,
      updated_at = now()
    WHERE id = p_child_id
      AND deleted_at IS NULL;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.activate_child_enrollment_staff(
  p_child_id UUID,
  p_verified_at TIMESTAMPTZ,
  p_school_year TEXT
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
  SET
    asbl_validated_at = p_verified_at,
    updated_at = now()
  WHERE id = p_child_id
    AND deleted_at IS NULL;

  UPDATE public.memberships
  SET
    status = 'ACTIVE'::membership_status,
    asbl_validated_at = p_verified_at,
    updated_at = now()
  WHERE child_id = p_child_id
    AND school_year = p_school_year
    AND status IN (
      'AWAITING_ASBL'::membership_status,
      'AWAITING_PAYMENT'::membership_status
    );
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
  SET
    enrollment_status = 'BROUILLON'::child_enrollment_status,
    asbl_validated_at = NULL,
    updated_at = now()
  WHERE id = p_child_id
    AND deleted_at IS NULL;
END;
$$;

-- ---------------------------------------------------------------------------
-- Parent couche A (043) — membership courante uniquement
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_child_enrollment_layer_a_parent(
  p_child_id UUID,
  p_status public.child_enrollment_status
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_membership_status membership_status;
BEGIN
  IF NOT public.is_active_user() OR NOT public.is_parent() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF p_child_id NOT IN (SELECT public.my_parent_child_ids()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF p_status NOT IN (
    'EN_ATTENTE_PAIEMENT'::child_enrollment_status,
    'PAYE_EN_ATTENTE_ASBL'::child_enrollment_status
  ) THEN
    RAISE EXCEPTION 'invalid_status';
  END IF;

  v_membership_status := public.layer_a_to_membership_status(p_status);

  UPDATE public.memberships
  SET
    status = v_membership_status,
    asbl_validated_at = NULL,
    updated_at = now()
  WHERE child_id = p_child_id
    AND school_year = public.current_school_year()
    AND parent_id = auth.uid();
END;
$$;

-- ---------------------------------------------------------------------------
-- Paiement confirmé (030) — membership uniquement
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_enrollment_paid(
  p_child_id UUID,
  p_membership_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_membership_id IS NULL THEN
    RAISE EXCEPTION 'membership_required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.payments p
    WHERE p.child_id = p_child_id
      AND p.status = 'PAID'::payment_status
      AND p.purpose = 'MEMBERSHIP'::payment_purpose
      AND p.reference_id = p_membership_id
  ) THEN
    RAISE EXCEPTION 'payment_not_confirmed';
  END IF;

  UPDATE public.memberships
  SET
    status = 'AWAITING_ASBL'::membership_status,
    updated_at = now()
  WHERE id = p_membership_id
    AND child_id = p_child_id
    AND status = 'AWAITING_PAYMENT'::membership_status;
END;
$$;

-- ---------------------------------------------------------------------------
-- Inscription parent atomique (027) — sans enrollment_status à l'insert
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_parent_enrollment_core(
  p_first_name TEXT,
  p_last_name TEXT,
  p_birth_date DATE,
  p_school_name TEXT,
  p_school_class TEXT,
  p_allergies TEXT,
  p_image_rights BOOLEAN,
  p_outing_authorization BOOLEAN,
  p_emergency_contact_name TEXT,
  p_emergency_contact_phone TEXT,
  p_guardian_relation guardian_relation,
  p_guardian_first_name TEXT,
  p_guardian_last_name TEXT,
  p_guardian_email TEXT,
  p_guardian_phone TEXT,
  p_guardian_can_pickup BOOLEAN,
  p_membership_plan membership_plan,
  p_school_year TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parent_id UUID := auth.uid();
  v_child_id UUID;
  v_guardian_id UUID;
  v_membership_id UUID;
  v_fee_cents INT;
  v_membership_status membership_status;
BEGIN
  IF v_parent_id IS NULL OR NOT public.is_active_user() OR NOT public.is_parent() THEN
    RAISE EXCEPTION 'permission_denied';
  END IF;

  IF p_school_year IS DISTINCT FROM public.current_school_year() THEN
    RAISE EXCEPTION 'invalid_school_year';
  END IF;

  IF p_membership_plan NOT IN ('BASE'::membership_plan, 'SCHOOL_SUPPORT'::membership_plan) THEN
    RAISE EXCEPTION 'invalid_plan';
  END IF;

  v_fee_cents := public.expected_membership_fee_cents(p_membership_plan, p_school_year);

  IF p_membership_plan = 'SCHOOL_SUPPORT'::membership_plan AND v_fee_cents > 0 THEN
    v_membership_status := 'AWAITING_PAYMENT'::membership_status;
  ELSE
    v_membership_status := 'AWAITING_ASBL'::membership_status;
  END IF;

  INSERT INTO public.children (
    first_name,
    last_name,
    birth_date,
    school_name,
    school_class,
    allergies,
    image_rights,
    outing_authorization,
    emergency_contact_name,
    emergency_contact_phone,
    status,
    created_by,
    created_via
  ) VALUES (
    trim(p_first_name),
    trim(p_last_name),
    p_birth_date,
    NULLIF(trim(COALESCE(p_school_name, '')), ''),
    NULLIF(trim(COALESCE(p_school_class, '')), ''),
    NULLIF(trim(COALESCE(p_allergies, '')), ''),
    COALESCE(p_image_rights, false),
    COALESCE(p_outing_authorization, false),
    NULLIF(trim(COALESCE(p_emergency_contact_name, '')), ''),
    NULLIF(trim(COALESCE(p_emergency_contact_phone, '')), ''),
    'ACTIF'::child_status,
    v_parent_id,
    'PARENT'::child_created_via
  )
  RETURNING id INTO v_child_id;

  INSERT INTO public.guardians (
    child_id,
    relation,
    first_name,
    last_name,
    email,
    phone,
    is_primary,
    can_pickup
  ) VALUES (
    v_child_id,
    p_guardian_relation,
    trim(p_guardian_first_name),
    trim(p_guardian_last_name),
    NULLIF(trim(COALESCE(p_guardian_email, '')), ''),
    trim(p_guardian_phone),
    true,
    COALESCE(p_guardian_can_pickup, true)
  )
  RETURNING id INTO v_guardian_id;

  INSERT INTO public.parent_child_links (
    parent_id,
    child_id,
    guardian_id
  ) VALUES (
    v_parent_id,
    v_child_id,
    v_guardian_id
  );

  INSERT INTO public.memberships (
    child_id,
    parent_id,
    school_year,
    plan,
    fee_cents,
    status
  ) VALUES (
    v_child_id,
    v_parent_id,
    p_school_year,
    p_membership_plan,
    v_fee_cents,
    v_membership_status
  )
  RETURNING id INTO v_membership_id;

  RETURN jsonb_build_object(
    'child_id', v_child_id,
    'guardian_id', v_guardian_id,
    'membership_id', v_membership_id
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- Upgrade soutien parent (020)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.request_school_support_upgrade(p_child_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parent_id UUID := auth.uid();
  v_school_year TEXT;
  v_fee_cents INT;
  v_new_status membership_status;
  v_updated INT;
BEGIN
  IF v_parent_id IS NULL OR NOT public.is_active_user() OR NOT public.is_parent() THEN
    RAISE EXCEPTION 'permission_denied';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.parent_child_links pcl
    WHERE pcl.parent_id = v_parent_id
      AND pcl.child_id = p_child_id
      AND pcl.verified_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'link_not_verified';
  END IF;

  v_school_year := public.current_school_year();

  SELECT COALESCE(s.school_support_fee_cents, 0)
  INTO v_fee_cents
  FROM public.asbl_settings s
  WHERE s.school_year = v_school_year
  LIMIT 1;

  v_fee_cents := COALESCE(v_fee_cents, 0);

  IF v_fee_cents > 0 THEN
    v_new_status := 'AWAITING_PAYMENT'::membership_status;
  ELSE
    v_new_status := 'AWAITING_ASBL'::membership_status;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.memberships m
    WHERE m.child_id = p_child_id
      AND m.school_year = v_school_year
      AND m.plan = 'SCHOOL_SUPPORT'::membership_plan
  ) THEN
    RAISE EXCEPTION 'already_school_support';
  END IF;

  UPDATE public.memberships
  SET
    plan = 'SCHOOL_SUPPORT'::membership_plan,
    fee_cents = v_fee_cents,
    status = v_new_status,
    asbl_validated_at = NULL,
    updated_at = now()
  WHERE child_id = p_child_id
    AND parent_id = v_parent_id
    AND school_year = v_school_year
    AND plan = 'BASE'::membership_plan;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated = 0 THEN
    RAISE EXCEPTION 'membership_not_upgradable';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.layer_a_to_membership_status(child_enrollment_status) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.layer_a_to_membership_status(child_enrollment_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.layer_a_to_membership_status(child_enrollment_status) TO service_role;

COMMENT ON COLUMN public.children.enrollment_status IS
  'DEPRECATED C1 étape A — plus de double-write runtime. Lecture via memberships + get_child_enrollment_state. Drop prévu étape B.';
