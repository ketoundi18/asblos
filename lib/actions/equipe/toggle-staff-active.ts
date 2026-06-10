"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth/session";
import { canManageUsers } from "@/lib/auth/permissions";
import { logAuditEvent } from "@/lib/audit/log-audit";
import { getAuditIpHash } from "@/lib/audit/request-ip";
import { reportError } from "@/lib/monitoring/report-error";
import { guardUuid } from "@/lib/validations/uuid";

export async function toggleStaffActiveAction(
  memberId: string,
  formData: FormData
) {
  guardUuid(memberId, "/equipe/membres");
  const profile = await requireProfile();
  const returnTo = "/equipe/membres";

  if (!canManageUsers(profile.role)) {
    redirect(`${returnTo}?error=permission`);
  }

  if (memberId === profile.id) {
    redirect(`${returnTo}?error=staff-self-toggle`);
  }

  const nextActive = formData.get("next_active") === "true";
  const admin = createAdminClient();

  const { data: member, error: fetchError } = await admin
    .from("profiles")
    .select("id, role, email, full_name, is_active")
    .eq("id", memberId)
    .maybeSingle();

  if (fetchError || !member) {
    redirect(`${returnTo}?error=staff-not-found`);
  }

  if (member.role === "ADMIN") {
    redirect(`${returnTo}?error=staff-admin-protected`);
  }

  if (member.is_active === nextActive) {
    redirect(returnTo);
  }

  const { error: updateError } = await admin
    .from("profiles")
    .update({ is_active: nextActive })
    .eq("id", memberId);

  if (updateError) {
    void reportError(new Error("toggleStaffActiveAction"), {
      memberId,
      pgCode: updateError.code,
    });
    redirect(`${returnTo}?error=db`);
  }

  const ipHash = await getAuditIpHash();
  await logAuditEvent({
    action: nextActive ? "STAFF_ACCOUNT_ACTIVATED" : "STAFF_ACCOUNT_DEACTIVATED",
    entityType: "profiles",
    entityId: memberId,
    actorId: profile.id,
    actorRole: profile.role,
    metadata: {
      email: member.email,
      full_name: member.full_name,
    },
    ipHash,
  });

  revalidatePath("/equipe/membres");
  redirect(
    `${returnTo}?success=${nextActive ? "staff-activated" : "staff-deactivated"}`
  );
}
