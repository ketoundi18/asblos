"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/audit/log-audit";
import { requireProfile } from "@/lib/auth/session";
import { canManageChildGdpr } from "@/lib/auth/permissions";

function birthYearPlaceholder(isoDate: string): string {
  const year = isoDate.slice(0, 4);
  if (!/^\d{4}$/.test(year)) return "2000-01-01";
  return `${year}-01-01`;
}

/** Anonymise une fiche enfant et les tuteurs liés (irréversible). Admin uniquement. */
export async function anonymizeChildAction(
  childId: string,
  _formData?: FormData
) {
  void _formData;
  const profile = await requireProfile();

  if (!canManageChildGdpr(profile.role)) {
    redirect(`/enfants/${childId}?error=permission`);
  }

  const admin = createAdminClient();

  const { data: child, error: fetchError } = await admin
    .from("children")
    .select("id, birth_date, anonymized_at")
    .eq("id", childId)
    .maybeSingle<{ id: string; birth_date: string; anonymized_at: string | null }>();

  if (fetchError || !child) {
    redirect(`/enfants/${childId}?error=notfound`);
  }

  if (child.anonymized_at) {
    redirect(`/enfants/${childId}?error=already_anonymized`);
  }

  const now = new Date().toISOString();
  const pseudoLastName = childId.replace(/-/g, "").slice(0, 8).toUpperCase();

  const { error: childError } = await admin
    .from("children")
    .update({
      first_name: "Anonymisé",
      last_name: pseudoLastName,
      birth_date: birthYearPlaceholder(child.birth_date),
      school_name: null,
      school_class: null,
      allergies: null,
      medical_notes: null,
      emergency_contact_name: null,
      emergency_contact_phone: null,
      notes: null,
      image_rights: false,
      image_rights_date: null,
      outing_authorization: false,
      outing_auth_date: null,
      status: "ARCHIVE",
      deleted_at: now,
      anonymized_at: now,
      updated_by: profile.id,
    })
    .eq("id", childId);

  if (childError) {
    redirect(`/enfants/${childId}?error=anonymize`);
  }

  const { data: guardians } = await admin
    .from("guardians")
    .select("id")
    .eq("child_id", childId);

  for (const guardian of guardians ?? []) {
    await admin
      .from("guardians")
      .update({
        first_name: "Anonymisé",
        last_name: "—",
        email: null,
        phone: "0000000000",
      })
      .eq("id", guardian.id);
  }

  await logAuditEvent({
    action: "CHILD_ANONYMIZED",
    entityType: "children",
    entityId: childId,
    actorId: profile.id,
    actorRole: profile.role,
    metadata: { pseudo_last_name: pseudoLastName },
  });

  revalidatePath("/enfants");
  revalidatePath(`/enfants/${childId}`);
  redirect("/enfants?success=anonymized");
}
