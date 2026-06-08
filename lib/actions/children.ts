"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import {
  canCreateChild,
  canModifyChild,
  canDeleteChild,
} from "@/lib/auth/permissions";
import { childFormSchema } from "@/lib/validations/child";
import type { Database } from "@/types/database";
import type { ChildFormState } from "@/lib/actions/children-state";
import { getAsblSettingsForCurrentYear } from "@/lib/data/asbl-settings";
import { getCurrentSchoolYear } from "@/lib/school-year";
import {
  buildStaffEnrollmentQuote,
  parseMembershipPlan,
  parseProgramId,
  parseSelectedSlotIds,
} from "@/lib/asbl/fee-utils";
import { resolveParentProfileByEmail } from "@/lib/enrollment/resolve-parent-by-email";
import { enrollSchoolSupportByStaff } from "@/lib/enrollment/enroll-school-support-by-staff";
import { logAuditEvent } from "@/lib/audit/log-audit";

type ChildInsert = Database["public"]["Tables"]["children"]["Insert"];
type ChildUpdate = Database["public"]["Tables"]["children"]["Update"];
type GuardianInsert = Database["public"]["Tables"]["guardians"]["Insert"];
type GuardianUpdate = Database["public"]["Tables"]["guardians"]["Update"];

function parseChildForm(formData: FormData) {
  return childFormSchema.safeParse({
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name"),
    birth_date: formData.get("birth_date"),
    school_name: formData.get("school_name") || undefined,
    school_class: formData.get("school_class") || undefined,
    allergies: formData.get("allergies") || undefined,
    medical_notes: formData.get("medical_notes") || undefined,
    image_rights: formData.get("image_rights") === "on",
    image_rights_date: formData.get("image_rights_date") || undefined,
    outing_authorization: formData.get("outing_authorization") === "on",
    outing_auth_date: formData.get("outing_auth_date") || undefined,
    emergency_contact_name: formData.get("emergency_contact_name") || undefined,
    emergency_contact_phone:
      formData.get("emergency_contact_phone") || undefined,
    notes: formData.get("notes") || undefined,
    status: formData.get("status") || "ACTIF",
    guardian_relation: formData.get("guardian_relation"),
    guardian_first_name: formData.get("guardian_first_name"),
    guardian_last_name: formData.get("guardian_last_name"),
    guardian_email: formData.get("guardian_email") || "",
    guardian_phone: formData.get("guardian_phone"),
    guardian_can_pickup: formData.get("guardian_can_pickup") === "on",
  });
}

function mapFieldErrors(
  issues: { path: (string | number)[]; message: string }[]
): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const field = String(issue.path[0]);
    if (!fieldErrors[field]) {
      fieldErrors[field] = issue.message;
    }
  }
  return fieldErrors;
}

function emptyToNull(value?: string) {
  return value && value.trim() !== "" ? value.trim() : null;
}

type StaffEnrollmentAttachResult = {
  fieldErrors?: Record<string, string>;
  enrollmentWarning?: string;
};

function validateStaffEnrollmentInput(
  formData: FormData,
  guardianEmailInput?: string
): Record<string, string> | null {
  const plan = parseMembershipPlan(formData.get("membership_plan"));
  const guardianEmail = emptyToNull(guardianEmailInput);

  if (plan === "SCHOOL_SUPPORT" && !guardianEmail) {
    return {
      guardian_email:
        "Indiquez l'e-mail du parent pour inscrire au soutien scolaire.",
    };
  }

  return null;
}

async function attachStaffEnrollmentOnCreate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  staffProfileId: string,
  formData: FormData,
  childId: string,
  guardianId: string,
  guardianEmailInput?: string
): Promise<StaffEnrollmentAttachResult> {
  const plan = parseMembershipPlan(formData.get("membership_plan"));
  const guardianEmail = emptyToNull(guardianEmailInput);

  if (!guardianEmail) {
    return {};
  }

  const parent = await resolveParentProfileByEmail(supabase, guardianEmail);
  if (!parent) {
    if (plan === "SCHOOL_SUPPORT") {
      return {
        fieldErrors: {
          guardian_email:
            "Aucun compte parent actif avec cet e-mail. Créez d'abord le compte parent.",
        },
      };
    }
    return {};
  }
  const paymentReceived = formData.get("membership_payment_received") === "on";
  const { settings } = await getAsblSettingsForCurrentYear();
  const quote = buildStaffEnrollmentQuote(plan, settings, paymentReceived);
  const programId = parseProgramId(formData.get("school_support_program_id"));
  const slotIds = parseSelectedSlotIds(formData);
  const verifiedAt =
    quote.membershipStatus === "ACTIVE" ? new Date().toISOString() : null;

  const { error: linkError } = await supabase.from("parent_child_links").insert({
    parent_id: parent.id,
    child_id: childId,
    guardian_id: guardianId,
    verified_at: verifiedAt,
  });

  if (linkError && !linkError.message.includes("unique")) {
    return {
      fieldErrors: {
        guardian_email: `Lien parent impossible (${linkError.message}).`,
      },
    };
  }

  if (quote.enrollmentStatus === "VALIDE") {
    await supabase
      .from("children")
      .update({
        enrollment_status: "VALIDE",
        asbl_validated_at: verifiedAt,
      })
      .eq("id", childId);
  } else if (quote.enrollmentStatus === "EN_ATTENTE_PAIEMENT") {
    await supabase
      .from("children")
      .update({ enrollment_status: "EN_ATTENTE_PAIEMENT" })
      .eq("id", childId);
  }

  const { data: membership, error: membershipError } = await supabase
    .from("memberships")
    .insert({
      child_id: childId,
      parent_id: parent.id,
      school_year: getCurrentSchoolYear(),
      plan: quote.membershipPlan,
      fee_cents: quote.totalCents,
      status: quote.membershipStatus,
      asbl_validated_at: verifiedAt,
    })
    .select("id")
    .single<{ id: string }>();

  if (membershipError || !membership) {
    const detail = membershipError?.message ?? "erreur inconnue";
    return {
      fieldErrors: {
        guardian_email: `Adhésion non enregistrée (${detail}). Lance 022_memberships_staff_insert.sql dans Supabase.`,
      },
    };
  }

  if (plan === "SCHOOL_SUPPORT" && programId) {
    const enrollResult = await enrollSchoolSupportByStaff(supabase, {
      childId,
      parentId: parent.id,
      membershipId: membership.id,
      programId,
      slotIds,
      enrolledByStaffId: staffProfileId,
    });

    if (!enrollResult.ok) {
      return { enrollmentWarning: enrollResult.error };
    }
  }

  return {};
}

export async function createChildAction(
  _prevState: ChildFormState,
  formData: FormData
): Promise<ChildFormState> {
  const profile = await requireProfile();

  if (!canCreateChild(profile.role)) {
    return {
      error: "Tu n'as pas la permission de créer une fiche enfant.",
      fieldErrors: {},
    };
  }

  const parsed = parseChildForm(formData);
  if (!parsed.success) {
    return {
      error: null,
      fieldErrors: mapFieldErrors(parsed.error.issues),
    };
  }

  const data = parsed.data;
  const supabase = await createClient();

  const planField = formData.get("membership_plan");
  if (planField !== null) {
    const enrollmentFieldErrors = validateStaffEnrollmentInput(
      formData,
      data.guardian_email
    );
    if (enrollmentFieldErrors) {
      return {
        error: null,
        fieldErrors: enrollmentFieldErrors,
      };
    }

    const plan = parseMembershipPlan(planField);
    const guardianEmail = emptyToNull(data.guardian_email);
    if (plan === "SCHOOL_SUPPORT" && guardianEmail) {
      const parent = await resolveParentProfileByEmail(supabase, guardianEmail);
      if (!parent) {
        return {
          error: null,
          fieldErrors: {
            guardian_email:
              "Aucun compte parent actif avec cet e-mail. Créez d'abord le compte parent.",
          },
        };
      }
    }
  }

  const childPayload: ChildInsert = {
    first_name: data.first_name.trim(),
    last_name: data.last_name.trim(),
    birth_date: data.birth_date,
    school_name: emptyToNull(data.school_name),
    school_class: emptyToNull(data.school_class),
    allergies: emptyToNull(data.allergies),
    medical_notes: emptyToNull(data.medical_notes),
    image_rights: data.image_rights,
    image_rights_date: emptyToNull(data.image_rights_date),
    outing_authorization: data.outing_authorization,
    outing_auth_date: emptyToNull(data.outing_auth_date),
    emergency_contact_name: emptyToNull(data.emergency_contact_name),
    emergency_contact_phone: emptyToNull(data.emergency_contact_phone),
    notes: emptyToNull(data.notes),
    status: data.status,
    created_by: profile.id,
    updated_by: profile.id,
  };

  const { data: child, error: childError } = await supabase
    .from("children")
    .insert(childPayload)
    .select("id")
    .single<{ id: string }>();

  if (childError || !child) {
    return {
      error: "Impossible de créer la fiche. Réessaie dans un instant.",
      fieldErrors: {},
    };
  }

  const { data: guardian, error: guardianError } = await supabase
    .from("guardians")
    .insert({
      child_id: child.id,
      relation: data.guardian_relation,
      first_name: data.guardian_first_name.trim(),
      last_name: data.guardian_last_name.trim(),
      email: emptyToNull(data.guardian_email),
      phone: data.guardian_phone.trim(),
      is_primary: true,
      can_pickup: data.guardian_can_pickup,
    })
    .select("id")
    .single<{ id: string }>();

  if (guardianError || !guardian) {
    return {
      error: "Enfant créé, mais le parent/tuteur n'a pas pu être enregistré.",
      fieldErrors: {},
    };
  }

  await logAuditEvent({
    action: "CHILD_CREATED",
    entityType: "children",
    entityId: child.id,
    actorId: profile.id,
    actorRole: profile.role,
    metadata: { created_via: "STAFF" },
  });

  if (planField !== null) {
    const enrollmentResult = await attachStaffEnrollmentOnCreate(
      supabase,
      profile.id,
      formData,
      child.id,
      guardian.id,
      data.guardian_email
    );

    if (enrollmentResult.fieldErrors) {
      return {
        error:
          "Fiche enfant créée, mais l'adhésion n'a pas pu être enregistrée. Modifiez la fiche ou contactez l'administrateur.",
        fieldErrors: enrollmentResult.fieldErrors,
      };
    }

    revalidatePath("/enfants");
    revalidatePath("/");
    revalidatePath("/soutien-scolaire");
    revalidatePath("/administration");

    const warning = enrollmentResult.enrollmentWarning
      ? `?warning=${encodeURIComponent(enrollmentResult.enrollmentWarning)}`
      : "";

    redirect(`/enfants/${child.id}${warning}`);
  }

  revalidatePath("/enfants");
  redirect(`/enfants/${child.id}`);
}

export async function updateChildAction(
  childId: string,
  _prevState: ChildFormState,
  formData: FormData
): Promise<ChildFormState> {
  const profile = await requireProfile();

  if (!canModifyChild(profile.role)) {
    return {
      error: "Tu n'as pas la permission de modifier cette fiche.",
      fieldErrors: {},
    };
  }

  const parsed = parseChildForm(formData);
  if (!parsed.success) {
    return {
      error: null,
      fieldErrors: mapFieldErrors(parsed.error.issues),
    };
  }

  const data = parsed.data;
  const supabase = await createClient();

  const childUpdate: ChildUpdate = {
    first_name: data.first_name.trim(),
    last_name: data.last_name.trim(),
    birth_date: data.birth_date,
    school_name: emptyToNull(data.school_name),
    school_class: emptyToNull(data.school_class),
    allergies: emptyToNull(data.allergies),
    medical_notes: emptyToNull(data.medical_notes),
    image_rights: data.image_rights,
    image_rights_date: emptyToNull(data.image_rights_date),
    outing_authorization: data.outing_authorization,
    outing_auth_date: emptyToNull(data.outing_auth_date),
    emergency_contact_name: emptyToNull(data.emergency_contact_name),
    emergency_contact_phone: emptyToNull(data.emergency_contact_phone),
    notes: emptyToNull(data.notes),
    status: data.status,
    updated_by: profile.id,
  };

  const { error: childError } = await supabase
    .from("children")
    .update(childUpdate)
    .eq("id", childId);

  if (childError) {
    return {
      error: "Impossible de mettre à jour la fiche. Réessaie dans un instant.",
      fieldErrors: {},
    };
  }

  const { data: primaryGuardian } = await supabase
    .from("guardians")
    .select("id")
    .eq("child_id", childId)
    .eq("is_primary", true)
    .maybeSingle<{ id: string }>();

  const guardianPayload: GuardianUpdate = {
    relation: data.guardian_relation,
    first_name: data.guardian_first_name.trim(),
    last_name: data.guardian_last_name.trim(),
    email: emptyToNull(data.guardian_email),
    phone: data.guardian_phone.trim(),
    can_pickup: data.guardian_can_pickup,
  };

  if (primaryGuardian?.id) {
    await supabase
      .from("guardians")
      .update(guardianPayload)
      .eq("id", primaryGuardian.id);
  } else {
    const guardianInsert: GuardianInsert = {
      child_id: childId,
      relation: data.guardian_relation,
      first_name: data.guardian_first_name.trim(),
      last_name: data.guardian_last_name.trim(),
      email: emptyToNull(data.guardian_email),
      phone: data.guardian_phone.trim(),
      is_primary: true,
      can_pickup: data.guardian_can_pickup,
    };
    await supabase.from("guardians").insert(guardianInsert);
  }

  revalidatePath("/enfants");
  revalidatePath(`/enfants/${childId}`);
  redirect(`/enfants/${childId}`);
}

export async function archiveChildAction(
  childId: string,
  _formData?: FormData
) {
  void _formData;
  const profile = await requireProfile();

  if (!canDeleteChild(profile.role)) {
    redirect(`/enfants/${childId}?error=permission`);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("children")
    .update({
      status: "ARCHIVE",
      deleted_at: new Date().toISOString(),
      updated_by: profile.id,
    })
    .eq("id", childId);

  if (error) {
    redirect(`/enfants/${childId}?error=archive`);
  }

  revalidatePath("/enfants");
  redirect("/enfants");
}
