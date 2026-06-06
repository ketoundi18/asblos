"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { isParentRole } from "@/lib/auth/roles";
import { childFormSchema } from "@/lib/validations/child";
import type { Database } from "@/types/database";
import { getAsblSettingsForCurrentYear } from "@/lib/data/asbl-settings";
import { getCurrentSchoolYear } from "@/lib/school-year";
import type { ParentEnrollmentState } from "@/lib/actions/parent-enrollment-state";

type ChildInsert = Database["public"]["Tables"]["children"]["Insert"];
type GuardianInsert = Database["public"]["Tables"]["guardians"]["Insert"];

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
  const feeCents = settings?.enrollment_fee_cents ?? 0;
  const needsPayment = feeCents > 0;
  const enrollmentStatus = needsPayment
    ? ("EN_ATTENTE_PAIEMENT" as const)
    : ("PAYE_EN_ATTENTE_ASBL" as const);

  const childRow: ChildInsert = {
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
    created_by: profile.id,
    created_via: "PARENT",
    enrollment_status: enrollmentStatus,
  };

  const { data: child, error: childError } = await supabase
    .from("children")
    .insert(childRow as never)
    .select("id")
    .single<{ id: string }>();

  if (childError || !child) {
    const detail = childError?.message ?? "erreur inconnue";
    return {
      error: `Impossible d'enregistrer la fiche enfant (${detail}). Vérifie que la migration 010 est lancée dans Supabase.`,
      fieldErrors: {},
    };
  }

  const guardianEmail =
    emptyToNull(data.guardian_email) ?? profile.email;

  const guardianRow: GuardianInsert = {
    child_id: child.id,
    relation: data.guardian_relation,
    first_name: data.guardian_first_name.trim(),
    last_name: data.guardian_last_name.trim(),
    email: guardianEmail,
    phone: data.guardian_phone.trim(),
    is_primary: true,
    can_pickup: data.guardian_can_pickup,
  };

  const { data: guardian, error: guardianError } = await supabase
    .from("guardians")
    .insert(guardianRow as never)
    .select("id")
    .single<{ id: string }>();

  if (guardianError || !guardian) {
    const detail = guardianError?.message ?? "erreur inconnue";
    return {
      error: `Impossible d'enregistrer tes coordonnées (${detail}). Réessaie.`,
      fieldErrors: {},
    };
  }

  const { error: linkError } = await supabase.from("parent_child_links").insert({
    parent_id: profile.id,
    child_id: child.id,
    guardian_id: guardian.id,
  } as never);

  if (linkError) {
    const detail = linkError.message ?? "erreur inconnue";
    return {
      error: `Lien parent non enregistré (${detail}). Lance 010_parent_enrollment.sql dans Supabase.`,
      fieldErrors: {},
    };
  }

  const membershipStatus = needsPayment ? "AWAITING_PAYMENT" : "AWAITING_ASBL";
  const { error: membershipError } = await supabase.from("memberships").insert({
    child_id: child.id,
    parent_id: profile.id,
    school_year: getCurrentSchoolYear(),
    fee_cents: feeCents,
    status: membershipStatus,
  } as never);

  if (membershipError) {
    const detail = membershipError.message ?? "erreur inconnue";
    return {
      error: `Adhésion non enregistrée (${detail}). Lance 014_memberships_v2.sql dans Supabase.`,
      fieldErrors: {},
    };
  }

  revalidatePath("/espace-parents");
  return {
    error: null,
    fieldErrors: {},
    success: true,
    childId: child.id,
    needsPayment,
  };
}
