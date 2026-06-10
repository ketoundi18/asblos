"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { canModifyChild } from "@/lib/auth/permissions";
import type { Database } from "@/types/database";
import type { ChildFormState } from "@/lib/actions/children-state";
import {
  emptyToNull,
  mapFieldErrors,
  parseChildForm,
} from "@/lib/actions/children/child-form-parsing";
import { guardChildId } from "@/lib/validations/uuid";

type ChildUpdate = Database["public"]["Tables"]["children"]["Update"];
type GuardianInsert = Database["public"]["Tables"]["guardians"]["Insert"];
type GuardianUpdate = Database["public"]["Tables"]["guardians"]["Update"];

export async function updateChildAction(
  childId: string,
  _prevState: ChildFormState,
  formData: FormData
): Promise<ChildFormState> {
  guardChildId(childId);
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
    const { error: guardianError } = await supabase
      .from("guardians")
      .update(guardianPayload)
      .eq("id", primaryGuardian.id);

    if (guardianError) {
      return {
        error:
          "Fiche enfant mise à jour, mais le parent/tuteur n'a pas pu être enregistré. Réessaie.",
        fieldErrors: {},
      };
    }
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
    const { error: guardianError } = await supabase
      .from("guardians")
      .insert(guardianInsert);

    if (guardianError) {
      return {
        error:
          "Fiche enfant mise à jour, mais le parent/tuteur n'a pas pu être enregistré. Réessaie.",
        fieldErrors: {},
      };
    }
  }

  revalidatePath("/enfants");
  revalidatePath(`/enfants/${childId}`);
  redirect(`/enfants/${childId}`);
}
