"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/audit/log-audit";
import { requireProfile } from "@/lib/auth/session";
import { canManageChildGdpr } from "@/lib/auth/permissions";

function mapAnonymizeError(message: string): string {
  if (message.includes("child_not_anonymizable")) {
    return "already_anonymized";
  }
  if (message.includes("Could not find the function")) {
    return "migration_required";
  }
  return "anonymize";
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
  const { error } = await admin.rpc("anonymize_child", { p_child_id: childId });

  if (error) {
    redirect(`/enfants/${childId}?error=${mapAnonymizeError(error.message)}`);
  }

  const pseudoLastName = childId.replace(/-/g, "").slice(0, 8).toUpperCase();

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
