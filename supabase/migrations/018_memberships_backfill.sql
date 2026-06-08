-- Backfill adhésions manquantes (enfants staff + liens validés)
-- Prérequis : 014, 017
-- Safe à relancer

INSERT INTO memberships (child_id, parent_id, school_year, plan, fee_cents, status, asbl_validated_at)
SELECT
  c.id,
  pcl.parent_id,
  public.current_school_year(),
  CASE
    WHEN c.enrollment_status = 'EN_ATTENTE_PAIEMENT' THEN 'SCHOOL_SUPPORT'::membership_plan
    WHEN c.enrollment_status = 'PAYE_EN_ATTENTE_ASBL' THEN 'SCHOOL_SUPPORT'::membership_plan
    ELSE 'BASE'::membership_plan
  END,
  CASE
    WHEN c.enrollment_status = 'EN_ATTENTE_PAIEMENT' THEN
      COALESCE(
        (SELECT s.school_support_fee_cents FROM asbl_settings s WHERE s.school_year = public.current_school_year()),
        (SELECT s.enrollment_fee_cents FROM asbl_settings s WHERE s.school_year = public.current_school_year()),
        0
      )
    ELSE 0
  END,
  CASE c.enrollment_status
    WHEN 'EN_ATTENTE_PAIEMENT' THEN 'AWAITING_PAYMENT'::membership_status
    WHEN 'PAYE_EN_ATTENTE_ASBL' THEN 'AWAITING_ASBL'::membership_status
    WHEN 'VALIDE' THEN 'ACTIVE'::membership_status
    ELSE 'AWAITING_ASBL'::membership_status
  END,
  c.asbl_validated_at
FROM children c
JOIN parent_child_links pcl ON pcl.child_id = c.id AND pcl.verified_at IS NOT NULL
WHERE c.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.child_id = c.id
      AND m.school_year = public.current_school_year()
  )
ON CONFLICT (child_id, school_year) DO NOTHING;
