"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/audit/log-audit";
import { getAuditIpHash } from "@/lib/audit/request-ip";
import { requireProfile } from "@/lib/auth/session";
import { canManageChildGdpr } from "@/lib/auth/permissions";
import { guardChildId } from "@/lib/validations/uuid";

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
  guardChildId(childId);
  const profile = await requireProfile();

  if (!canManageChildGdpr(profile.role)) {
    redirect(`/enfants/${childId}?error=permission`);
  }

  const admin = createAdminClient();
  const { error } = await admin.rpc("anonymize_child", { p_child_id: childId });

  if (error) {
    const code = mapAnonymizeError(error.message);
    const detail =
      code === "migration_required"
        ? `&detail=${encodeURIComponent("Migration 028 (anonymisation RGPD) requise dans Supabase.")}`
        : "";
    redirect(`/enfants/${childId}?error=${code}${detail}`);
  }

  const pseudoLastName = childId.replace(/-/g, "").slice(0, 8).toUpperCase();
  const ipHash = await getAuditIpHash();

  await logAuditEvent({
    action: "CHILD_ANONYMIZED",
    entityType: "children",
    entityId: childId,
    actorId: profile.id,
    actorRole: profile.role,
    metadata: { pseudo_last_name: pseudoLastName },
    ipHash,
  });

  revalidatePath("/enfants");
  revalidatePath(`/enfants/${childId}`);
  redirect("/enfants?success=anonymized");
}
