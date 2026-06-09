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

function mapAnonymizeError(message: string): string {
  if (message.includes("child_not_anonymizable")) {
    return "already_anonymized";
  }
  return "anonymize";
}

async function anonymizeViaRpc(
  admin: ReturnType<typeof createAdminClient>,
  childId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await admin.rpc("anonymize_child", { p_child_id: childId });

  if (!error) {
    return { ok: true };
  }

  if (error.message.includes("Could not find the function")) {
    return { ok: false, error: "migration_missing" };
  }

  return { ok: false, error: mapAnonymizeError(error.message) };
}

/** Fallback si migration 028 pas encore appliquée — vérifie chaque étape. */
async function anonymizeViaSteps(
  admin: ReturnType<typeof createAdminClient>,
  childId: string,
  profileId: string
): Promise<{ ok: true; pseudoLastName: string } | { ok: false; error: string }> {
  const { data: child, error: fetchError } = await admin
    .from("children")
    .select("id, birth_date, anonymized_at")
    .eq("id", childId)
    .maybeSingle<{ id: string; birth_date: string; anonymized_at: string | null }>();

  if (fetchError || !child) {
    return { ok: false, error: "notfound" };
  }

  if (child.anonymized_at) {
    return { ok: false, error: "already_anonymized" };
  }

  const now = new Date().toISOString();
  const pseudoLastName = childId.replace(/-/g, "").slice(0, 8).toUpperCase();

  const { data: guardians, error: guardiansListError } = await admin
    .from("guardians")
    .select("id")
    .eq("child_id", childId);

  if (guardiansListError) {
    return { ok: false, error: "anonymize" };
  }

  for (const guardian of guardians ?? []) {
    const { error: guardianError } = await admin
      .from("guardians")
      .update({
        first_name: "Anonymisé",
        last_name: "—",
        email: null,
        phone: "0000000000",
      })
      .eq("id", guardian.id);

    if (guardianError) {
      return { ok: false, error: "anonymize" };
    }
  }

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
      updated_by: profileId,
    })
    .eq("id", childId);

  if (childError) {
    return { ok: false, error: "anonymize" };
  }

  return { ok: true, pseudoLastName };
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
  const viaRpc = await anonymizeViaRpc(admin, childId);

  let pseudoLastName = childId.replace(/-/g, "").slice(0, 8).toUpperCase();

  if (!viaRpc.ok) {
    if (viaRpc.error === "migration_missing") {
      const viaSteps = await anonymizeViaSteps(admin, childId, profile.id);
      if (!viaSteps.ok) {
        redirect(`/enfants/${childId}?error=${viaSteps.error}`);
      }
      pseudoLastName = viaSteps.pseudoLastName;
    } else {
      redirect(`/enfants/${childId}?error=${viaRpc.error}`);
    }
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
