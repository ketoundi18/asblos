"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { isParentRole } from "@/lib/auth/roles";
import { childFormSchema } from "@/lib/validations/child";
import { getAsblSettingsForCurrentYear } from "@/lib/data/asbl-settings";
import { getCurrentSchoolYear } from "@/lib/school-year";
import type { ParentEnrollmentState } from "@/lib/actions/parent-enrollment-state";
import {
  buildEnrollmentQuote,
  parseMembershipPlan,
} from "@/lib/enrollment/build-enrollment-quote";
import { createParentEnrollmentCore } from "@/lib/enrollment/create-parent-enrollment-core";
import { logAuditEvent } from "@/lib/audit/log-audit";
import { getAuditIpHash } from "@/lib/audit/request-ip";
import { emptyToNull, mapFieldErrors } from "@/lib/utils/form-utils";

function parseForm(formData: FormData) {
  return childFormSchema.safeParse({
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name"),
    birth_date: formData.get("birth_date"),
    school_name: formData.get("school_name") || undefined,
    school_class: formData.get("school_class") || undefined,
    allergies: formData.get("allergies") || undefined,
    medical_notes: undefined,
    image_rights: formData.get("image_rights") === "on",
    image_rights_date: undefined,
    outing_authorization: formData.get("outing_authorization") === "on",
    outing_auth_date: undefined,
    emergency_contact_name: formData.get("emergency_contact_name") || undefined,
    emergency_contact_phone:
      formData.get("emergency_contact_phone") || undefined,
    notes: undefined,
    status: "ACTIF",
    guardian_relation: formData.get("guardian_relation"),
    guardian_first_name: formData.get("guardian_first_name"),
    guardian_last_name: formData.get("guardian_last_name"),
    guardian_email: formData.get("guardian_email") || "",
    guardian_phone: formData.get("guardian_phone"),
    guardian_can_pickup: formData.get("guardian_can_pickup") === "on",
  });
}

function revalidateParentEnrollmentPaths() {
  revalidatePath("/espace-parents");
  revalidatePath("/espace-parents/soutien-scolaire");
  revalidatePath("/administration");
  revalidatePath("/enfants");
  revalidatePath("/paiements");
}

export async function createParentEnrollmentAction(
  _prevState: ParentEnrollmentState,
  formData: FormData
): Promise<ParentEnrollmentState> {
  const profile = await requireProfile();

  if (!isParentRole(profile.role)) {
    return {
      error: "Seuls les comptes parents peuvent inscrire un enfant ici.",
      fieldErrors: {},
    };
  }

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return {
      error: "Corrige les champs en rouge et réessaie.",
      fieldErrors: mapFieldErrors(parsed.error.issues),
    };
  }

  const data = parsed.data;
  const supabase = await createClient();

  const { settings } = await getAsblSettingsForCurrentYear();
  const plan = parseMembershipPlan(formData.get("membership_plan"));
  const quote = buildEnrollmentQuote(plan, settings);

  const guardianEmail =
    emptyToNull(data.guardian_email) ?? profile.email;

  const coreResult = await createParentEnrollmentCore(supabase, {
    profileId: profile.id,
    profileEmail: profile.email,
    schoolYear: getCurrentSchoolYear(),
    quote,
    child: {
      first_name: data.first_name.trim(),
      last_name: data.last_name.trim(),
      birth_date: data.birth_date,
      school_name: emptyToNull(data.school_name),
      school_class: emptyToNull(data.school_class),
      allergies: emptyToNull(data.allergies),
      image_rights: data.image_rights,
      outing_authorization: data.outing_authorization,
      emergency_contact_name: emptyToNull(data.emergency_contact_name),
      emergency_contact_phone: emptyToNull(data.emergency_contact_phone),
      status: "ACTIF",
      enrollment_status: quote.enrollmentStatus,
    },
    guardian: {
      relation: data.guardian_relation,
      first_name: data.guardian_first_name.trim(),
      last_name: data.guardian_last_name.trim(),
      email: guardianEmail,
      phone: data.guardian_phone.trim(),
      is_primary: true,
      can_pickup: data.guardian_can_pickup,
    },
  });

  if (!coreResult.ok) {
    return {
      error: coreResult.error,
      fieldErrors: {},
    };
  }

  const { childId, membershipId } = coreResult;

  const ipHash = await getAuditIpHash();
  await logAuditEvent({
    action: "CHILD_CREATED",
    entityType: "children",
    entityId: childId,
    actorId: profile.id,
    actorRole: profile.role,
    metadata: {
      created_via: "PARENT",
      membership_id: membershipId,
    },
    ipHash,
  });

  revalidateParentEnrollmentPaths();
  return {
    error: null,
    fieldErrors: {},
    success: true,
    childId,
    childFirstName: data.first_name.trim(),
    needsPayment: quote.needsPayment,
    schoolSupport: plan === "SCHOOL_SUPPORT",
  };
}
