-- P0 Sécurité : durcissement RPC inscription/paiement + RLS adhésions
-- Prérequis : 026
-- Safe à relancer

-- ---------------------------------------------------------------------------
-- Tarif attendu côté serveur (plan + année scolaire)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.expected_membership_fee_cents(
  p_plan membership_plan,
  p_school_year TEXT
)
RETURNS INT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_plan = 'SCHOOL_SUPPORT'::membership_plan THEN
      COALESCE(
        (
          SELECT s.school_support_fee_cents
          FROM public.asbl_settings s
          WHERE s.school_year = p_school_year
          LIMIT 1
        ),
        0
      )
    ELSE 0
  END;
$$;

REVOKE ALL ON FUNCTION public.expected_membership_fee_cents(membership_plan, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expected_membership_fee_cents(membership_plan, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.expected_membership_fee_cents(membership_plan, TEXT) TO service_role;

-- ---------------------------------------------------------------------------
-- Inscription parent : statuts et tarifs calculés en SQL (plus côté client)
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.create_parent_enrollment_core(
  TEXT, TEXT, DATE, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN, TEXT, TEXT,
  guardian_relation, TEXT, TEXT, TEXT, TEXT, BOOLEAN,
  child_enrollment_status, membership_plan, INT, membership_status, TEXT
);

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
  v_enrollment_status child_enrollment_status;
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
    v_enrollment_status := 'EN_ATTENTE_PAIEMENT'::child_enrollment_status;
    v_membership_status := 'AWAITING_PAYMENT'::membership_status;
  ELSE
    v_enrollment_status := 'PAYE_EN_ATTENTE_ASBL'::child_enrollment_status;
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
    created_via,
    enrollment_status
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
    'PARENT'::child_created_via,
    v_enrollment_status
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

REVOKE ALL ON FUNCTION public.create_parent_enrollment_core(
  TEXT, TEXT, DATE, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN, TEXT, TEXT,
  guardian_relation, TEXT, TEXT, TEXT, TEXT, BOOLEAN,
  membership_plan, TEXT
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_parent_enrollment_core(
  TEXT, TEXT, DATE, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN, TEXT, TEXT,
  guardian_relation, TEXT, TEXT, TEXT, TEXT, BOOLEAN,
  membership_plan, TEXT
) TO authenticated;

-- ---------------------------------------------------------------------------
-- sync_enrollment_paid : service_role uniquement + paiement PAID requis
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
  IF NOT EXISTS (
    SELECT 1
    FROM public.payments p
    WHERE p.child_id = p_child_id
      AND p.status = 'PAID'::payment_status
      AND (
        p_membership_id IS NULL
        OR p.reference_id = p_membership_id::text
      )
  ) THEN
    RAISE EXCEPTION 'payment_not_confirmed';
  END IF;

  UPDATE public.children
  SET
    enrollment_status = 'PAYE_EN_ATTENTE_ASBL'::child_enrollment_status,
    updated_at = now()
  WHERE id = p_child_id
    AND deleted_at IS NULL;

  IF p_membership_id IS NOT NULL THEN
    UPDATE public.memberships
    SET
      status = 'AWAITING_ASBL'::membership_status,
      updated_at = now()
    WHERE id = p_membership_id
      AND child_id = p_child_id
      AND status = 'AWAITING_PAYMENT'::membership_status;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_enrollment_paid(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_enrollment_paid(UUID, UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.sync_enrollment_paid(UUID, UUID) TO service_role;

-- ---------------------------------------------------------------------------
-- RLS adhésions parent : statuts et tarifs imposés côté serveur
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "memberships_insert_parent" ON memberships;
CREATE POLICY "memberships_insert_parent"
  ON memberships FOR INSERT
  WITH CHECK (
    public.is_active_user()
    AND public.is_parent()
    AND parent_id = auth.uid()
    AND child_id IN (SELECT public.my_parent_child_ids())
    AND plan IN ('BASE'::membership_plan, 'SCHOOL_SUPPORT'::membership_plan)
    AND school_year = public.current_school_year()
    AND fee_cents = public.expected_membership_fee_cents(plan, school_year)
    AND status = CASE
      WHEN plan = 'SCHOOL_SUPPORT'::membership_plan
        AND public.expected_membership_fee_cents(plan, school_year) > 0
      THEN 'AWAITING_PAYMENT'::membership_status
      ELSE 'AWAITING_ASBL'::membership_status
    END
  );
