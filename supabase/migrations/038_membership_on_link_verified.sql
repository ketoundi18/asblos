-- I5 : adhésion créée à la validation du lien parent (remplace syncMissingMemberships runtime)
-- Prérequis : 014, 017, 018
-- Safe à relancer

CREATE OR REPLACE FUNCTION public.ensure_membership_for_verified_link()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_child           public.children%ROWTYPE;
  v_school_year     TEXT;
  v_support_fee     INT;
  v_plan            membership_plan;
  v_status          membership_status;
  v_fee             INT;
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

  IF v_child.enrollment_status = 'EN_ATTENTE_PAIEMENT'::child_enrollment_status THEN
    v_plan := 'SCHOOL_SUPPORT'::membership_plan;
    v_status := 'AWAITING_PAYMENT'::membership_status;
    v_fee := v_support_fee;
  ELSIF v_child.enrollment_status = 'PAYE_EN_ATTENTE_ASBL'::child_enrollment_status THEN
    v_plan := 'SCHOOL_SUPPORT'::membership_plan;
    v_status := 'AWAITING_ASBL'::membership_status;
    v_fee := v_support_fee;
  ELSIF v_child.enrollment_status = 'VALIDE'::child_enrollment_status
     OR v_child.asbl_validated_at IS NOT NULL THEN
    v_plan := 'BASE'::membership_plan;
    v_status := 'ACTIVE'::membership_status;
    v_fee := 0;
  ELSIF v_child.enrollment_status = 'REFUSE'::child_enrollment_status THEN
    v_plan := 'BASE'::membership_plan;
    v_status := 'REJECTED'::membership_status;
    v_fee := 0;
  ELSE
    v_plan := 'BASE'::membership_plan;
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

DROP TRIGGER IF EXISTS trg_ensure_membership_on_parent_link ON public.parent_child_links;

CREATE TRIGGER trg_ensure_membership_on_parent_link
  AFTER INSERT OR UPDATE OF verified_at ON public.parent_child_links
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_membership_for_verified_link();

-- Backfill : liens déjà validés sans adhésion (même logique que 018)
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
