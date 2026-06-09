-- RGPD : anonymisation enfant + tuteurs en une transaction
-- Prérequis : 004, 027
-- Safe à relancer

CREATE OR REPLACE FUNCTION public.anonymize_child(p_child_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_birth_date DATE;
  v_pseudo TEXT;
  v_now TIMESTAMPTZ := now();
BEGIN
  SELECT c.birth_date
  INTO v_birth_date
  FROM public.children c
  WHERE c.id = p_child_id
    AND c.anonymized_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'child_not_anonymizable';
  END IF;

  v_pseudo := upper(left(replace(p_child_id::text, '-', ''), 8));

  UPDATE public.guardians
  SET
    first_name = 'Anonymisé',
    last_name = '—',
    email = NULL,
    phone = '0000000000',
    updated_at = v_now
  WHERE child_id = p_child_id;

  UPDATE public.children
  SET
    first_name = 'Anonymisé',
    last_name = v_pseudo,
    birth_date = make_date(extract(year FROM v_birth_date)::int, 1, 1),
    school_name = NULL,
    school_class = NULL,
    allergies = NULL,
    medical_notes = NULL,
    emergency_contact_name = NULL,
    emergency_contact_phone = NULL,
    notes = NULL,
    image_rights = false,
    image_rights_date = NULL,
    outing_authorization = false,
    outing_auth_date = NULL,
    status = 'ARCHIVE'::child_status,
    deleted_at = v_now,
    anonymized_at = v_now,
    updated_at = v_now
  WHERE id = p_child_id;
END;
$$;

REVOKE ALL ON FUNCTION public.anonymize_child(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.anonymize_child(UUID) TO service_role;
