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
    .insert(childPayload as never)
    .select("id")
    .single<{ id: string }>();

  if (childError || !child) {
    return {
      error: "Impossible de créer la fiche. Réessaie dans un instant.",
      fieldErrors: {},
    };
  }

  const { error: guardianError } = await supabase.from("guardians").insert({
    child_id: child.id,
    relation: data.guardian_relation,
    first_name: data.guardian_first_name.trim(),
    last_name: data.guardian_last_name.trim(),
    email: emptyToNull(data.guardian_email),
    phone: data.guardian_phone.trim(),
    is_primary: true,
    can_pickup: data.guardian_can_pickup,
  } as never);

  if (guardianError) {
    return {
      error: "Enfant créé, mais le parent/tuteur n'a pas pu être enregistré.",
      fieldErrors: {},
    };
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
    .update(childUpdate as never)
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
      .update(guardianPayload as never)
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
    await supabase.from("guardians").insert(guardianInsert as never);
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
    } as never)
    .eq("id", childId);

  if (error) {
    redirect(`/enfants/${childId}?error=archive`);
  }

  revalidatePath("/enfants");
  redirect("/enfants");
}
