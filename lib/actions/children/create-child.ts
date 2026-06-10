"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { canCreateChild } from "@/lib/auth/permissions";
import type { Database } from "@/types/database";
import type { ChildFormState } from "@/lib/actions/children-state";
import { parseMembershipPlan } from "@/lib/asbl/fee-utils";
import { resolveParentProfileByEmail } from "@/lib/enrollment/resolve-parent-by-email";
import { logAuditEvent } from "@/lib/audit/log-audit";
import {
  emptyToNull,
  mapFieldErrors,
  parseChildForm,
} from "@/lib/actions/children/child-form-parsing";
import {
  attachStaffEnrollmentOnCreate,
  validateStaffEnrollmentInput,
} from "@/lib/actions/children/staff-enrollment-on-create";

type ChildInsert = Database["public"]["Tables"]["children"]["Insert"];

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
    const incompleteNote = `[INCOMPLET ${new Date().toISOString().slice(0, 10)}] Tuteur non enregistré.`;
    const existingNotes = emptyToNull(data.notes);
    await supabase
      .from("children")
      .update({
        status: "INACTIF",
        notes: existingNotes
          ? `${incompleteNote}\n${existingNotes}`
          : incompleteNote,
        updated_by: profile.id,
      })
      .eq("id", child.id);

    return {
      error:
        "La fiche enfant a été créée en état incomplet (inactif). Corrigez le tuteur depuis la fiche ou contactez l'administrateur.",
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
      ? `?warning=${enrollmentResult.enrollmentWarning}`
      : "";

    redirect(`/enfants/${child.id}${warning}`);
  }

  revalidatePath("/enfants");
  redirect(`/enfants/${child.id}`);
}
