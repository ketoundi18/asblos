"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { canManageUsers } from "@/lib/auth/permissions";
import { getAsblSettingsForCurrentYear, getSchoolSupportFeeCents } from "@/lib/data/asbl-settings";
import {
  enrollmentStateIsSchoolSupportPendingConfirm,
  enrollmentStateNeedsPayment,
} from "@/lib/enrollment/child-enrollment-state";
import { getChildEnrollmentState } from "@/lib/enrollment/get-child-enrollment-state";
import { getCurrentSchoolYear } from "@/lib/school-year";
import {
  activatePendingSchoolSupportEnrollments,
  verifyParentLinkForChild,
} from "@/lib/enrollment/activate-pending-enrollments";
import { writeChildValidatedAfterSchoolSupportConfirm } from "@/lib/enrollment/enrollment-writes";
import { logAuditEvent } from "@/lib/audit/log-audit";
import { getAuditIpHash } from "@/lib/audit/request-ip";
import { guardChildId } from "@/lib/validations/uuid";

export async function confirmSchoolSupportMembershipAction(
  childId: string,
  formData: FormData
) {
  guardChildId(childId);
  const profile = await requireProfile();

  if (!canManageUsers(profile.role)) {
    redirect("/soutien-scolaire/demandes?error=permission");
  }

  const returnTo = safeStaffReturnPath(formData.get("return_to"));

  const supabase = await createClient();
  const schoolYear = getCurrentSchoolYear();
  const verifiedAt = new Date().toISOString();

  const { state, loadError } = await getChildEnrollmentState(childId, schoolYear);

  if (loadError?.includes("040_get_child_enrollment_state")) {
    redirect(`${returnTo}?error=soutien-confirm`);
  }

  if (!state || !enrollmentStateIsSchoolSupportPendingConfirm(state)) {
    if (state && enrollmentStateNeedsPayment(state)) {
      redirect(`${returnTo}?error=payment-required`);
    }
    redirect(`${returnTo}?error=soutien-not-found`);
  }

  const membership = state.layer_b;
  let membershipId: string | null = membership?.membership_id ?? null;

  if (membership) {
    if (enrollmentStateNeedsPayment(state)) {
      redirect(`${returnTo}?error=payment-required`);
    }

    const { error } = await supabase
      .from("memberships")
      .update({
        plan: "SCHOOL_SUPPORT",
        status: "ACTIVE",
        asbl_validated_at: verifiedAt,
      })
      .eq("id", membership.membership_id);

    if (error) {
      redirect(`${returnTo}?error=soutien-confirm`);
    }
  } else if (state.derived.is_legacy_pending_asbl) {
    const { settings } = await getAsblSettingsForCurrentYear();
    const feeCents = getSchoolSupportFeeCents(settings);
    const parentId = state.link.parent_id;

    if (!parentId) {
      redirect(`${returnTo}?error=soutien-not-found`);
    }

    const { data: inserted, error } = await supabase
      .from("memberships")
      .insert({
        child_id: childId,
        parent_id: parentId,
        school_year: schoolYear,
        plan: "SCHOOL_SUPPORT",
        fee_cents: feeCents,
        status: "ACTIVE",
        asbl_validated_at: verifiedAt,
      })
      .select("id")
      .single<{ id: string }>();

    if (error || !inserted) {
      redirect(`${returnTo}?error=soutien-confirm`);
    }
    membershipId = inserted.id;
  }

  await writeChildValidatedAfterSchoolSupportConfirm(supabase, {
    childId,
    verifiedAt,
  });

  await verifyParentLinkForChild(supabase, childId, verifiedAt);
  await activatePendingSchoolSupportEnrollments(supabase, childId);

  if (membershipId) {
    const ipHash = await getAuditIpHash();
    await logAuditEvent({
      action: "MEMBERSHIP_ACTIVATED",
      entityType: "memberships",
      entityId: membershipId,
      actorId: profile.id,
      actorRole: profile.role,
      metadata: {
        child_id: childId,
        source: "school_support_confirm",
        school_year: schoolYear,
      },
      ipHash,
    });
  }

  revalidatePath("/administration");
  revalidatePath("/soutien-scolaire");
  revalidatePath("/soutien-scolaire/demandes");
  revalidatePath("/espace-parents");
  revalidatePath("/espace-parents/soutien-scolaire");
  revalidatePath(`/enfants/${childId}`);
  redirect(`${returnTo}?success=soutien-confirmed`);
}

function safeStaffReturnPath(value: FormDataEntryValue | null): string {
  const raw = typeof value === "string" ? value.trim() : "";
  if (raw.startsWith("/") && !raw.startsWith("//")) {
    return raw.split("?")[0] || "/soutien-scolaire/demandes";
  }
  return "/soutien-scolaire/demandes";
}
