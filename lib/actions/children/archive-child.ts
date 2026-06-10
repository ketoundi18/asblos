"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { canDeleteChild } from "@/lib/auth/permissions";
import { logAuditEvent } from "@/lib/audit/log-audit";
import { getAuditIpHash } from "@/lib/audit/request-ip";
import { guardChildId } from "@/lib/validations/uuid";

export async function archiveChildAction(childId: string) {
  guardChildId(childId);
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

  const ipHash = await getAuditIpHash();
  await logAuditEvent({
    action: "CHILD_ARCHIVED",
    entityType: "children",
    entityId: childId,
    actorId: profile.id,
    actorRole: profile.role,
    ipHash,
  });

  revalidatePath("/enfants");
  redirect("/enfants");
}
