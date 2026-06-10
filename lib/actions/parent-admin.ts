"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { canManageUsers } from "@/lib/auth/permissions";
import { getCurrentSchoolYear } from "@/lib/school-year";
import {
  enrollmentStateBlocksAdminValidation,
} from "@/lib/enrollment/child-enrollment-state";
import { getChildEnrollmentState } from "@/lib/enrollment/get-child-enrollment-state";
import {
  activatePendingSchoolSupportEnrollments,
} from "@/lib/enrollment/activate-pending-enrollments";
import {
  writeChildRejectedByAdmin,
  writeChildValidatedByAdmin,
} from "@/lib/enrollment/enrollment-writes";
import { logAuditEvent } from "@/lib/audit/log-audit";
import { getAuditIpHash } from "@/lib/audit/request-ip";
import { guardUuid } from "@/lib/validations/uuid";

export async function validateParentLinkAction(
  linkId: string,
  formData: FormData
) {
  guardUuid(linkId, "/administration");
  const profile = await requireProfile();
  const returnTo = safeStaffReturnPath(formData.get("return_to"));

  if (!canManageUsers(profile.role)) {
    redirect(`${returnTo}?error=permission`);
  }

  const supabase = await createClient();

  const { data: link } = await supabase
    .from("parent_child_links")
    .select("child_id")
    .eq("id", linkId)
    .single<{ child_id: string }>();

  if (link?.child_id) {
    const { state, loadError } = await getChildEnrollmentState(link.child_id);

    if (loadError?.includes("040_get_child_enrollment_state")) {
      redirect(`${returnTo}?error=validate`);
    }

    if (state && enrollmentStateBlocksAdminValidation(state)) {
      redirect(`${returnTo}?error=payment-required`);
    }
  }

  const verifiedAt = new Date().toISOString();

  const { error } = await supabase
    .from("parent_child_links")
    .update({ verified_at: verifiedAt })
    .eq("id", linkId)
    .is("verified_at", null);

  if (error) {
    redirect(`${returnTo}?error=validate`);
  }

  if (link?.child_id) {
    await writeChildValidatedByAdmin(supabase, {
      childId: link.child_id,
      verifiedAt,
      schoolYear: getCurrentSchoolYear(),
    });

    await activatePendingSchoolSupportEnrollments(supabase, link.child_id);

    const ipHash = await getAuditIpHash();
    await logAuditEvent({
      action: "CHILD_VALIDATED",
      entityType: "children",
      entityId: link.child_id,
      actorId: profile.id,
      actorRole: profile.role,
      metadata: { link_id: linkId, source: "parent_admin_validate" },
      ipHash,
    });
  }

  revalidatePath("/administration");
  revalidatePath("/espace-parents");
  revalidatePath("/enfants");
  if (link?.child_id) {
    revalidatePath(`/enfants/${link.child_id}`);
  }
  redirect(`${returnTo}?success=validated`);
}

function safeStaffReturnPath(value: FormDataEntryValue | null): string {
  const raw = typeof value === "string" ? value.trim() : "";
  if (raw.startsWith("/") && !raw.startsWith("//")) {
    return raw.split("?")[0] || "/administration";
  }
  return "/administration";
}

export async function rejectParentLinkAction(linkId: string) {
  guardUuid(linkId, "/administration");
  const profile = await requireProfile();

  if (!canManageUsers(profile.role)) {
    redirect("/administration?error=permission");
  }

  const supabase = await createClient();

  const { data: link } = await supabase
    .from("parent_child_links")
    .select("child_id")
    .eq("id", linkId)
    .single<{ child_id: string }>();

  const { error } = await supabase
    .from("parent_child_links")
    .delete()
    .eq("id", linkId);

  if (error) {
    redirect("/administration?error=reject");
  }

  if (link?.child_id) {
    await writeChildRejectedByAdmin(supabase, {
      childId: link.child_id,
      schoolYear: getCurrentSchoolYear(),
    });

    const ipHash = await getAuditIpHash();
    await logAuditEvent({
      action: "CHILD_REJECTED",
      entityType: "children",
      entityId: link.child_id,
      actorId: profile.id,
      actorRole: profile.role,
      metadata: { link_id: linkId },
      ipHash,
    });
  }

  revalidatePath("/administration");
  revalidatePath("/espace-parents");
  revalidatePath("/enfants");
  redirect("/administration?success=rejected");
}
