"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { canManageUsers } from "@/lib/auth/permissions";
import { getAsblSettingsForCurrentYear, getSchoolSupportFeeCents } from "@/lib/data/asbl-settings";
import { getCurrentSchoolYear } from "@/lib/school-year";
import {
  activatePendingSchoolSupportEnrollments,
  verifyParentLinkForChild,
} from "@/lib/enrollment/activate-pending-enrollments";

export async function confirmSchoolSupportMembershipAction(childId: string) {
  const profile = await requireProfile();

  if (!canManageUsers(profile.role)) {
    redirect("/administration?error=permission");
  }

  const supabase = await createClient();
  const schoolYear = getCurrentSchoolYear();
  const verifiedAt = new Date().toISOString();

  const { data: membership } = await supabase
    .from("memberships")
    .select("id, status, fee_cents, plan")
    .eq("child_id", childId)
    .eq("school_year", schoolYear)
    .maybeSingle<{
      id: string;
      status: string;
      fee_cents: number;
      plan: string;
    }>();

  const { data: child } = await supabase
    .from("children")
    .select("enrollment_status")
    .eq("id", childId)
    .maybeSingle<{ enrollment_status: string | null }>();

  const isSchoolSupportPending =
    membership?.plan === "SCHOOL_SUPPORT" &&
    (membership.status === "AWAITING_ASBL" ||
      (membership.status === "AWAITING_PAYMENT" && membership.fee_cents <= 0));

  const isLegacyPending = child?.enrollment_status === "PAYE_EN_ATTENTE_ASBL";

  if (!isSchoolSupportPending && !isLegacyPending) {
    if (membership?.status === "AWAITING_PAYMENT" && membership.fee_cents > 0) {
      redirect("/administration?error=payment-required");
    }
    redirect("/administration?error=soutien-not-found");
  }

  if (membership) {
    if (membership.status === "AWAITING_PAYMENT" && membership.fee_cents > 0) {
      redirect("/administration?error=payment-required");
    }

    const { error } = await supabase
      .from("memberships")
      .update({
        plan: "SCHOOL_SUPPORT",
        status: "ACTIVE",
        asbl_validated_at: verifiedAt,
      } as never)
      .eq("id", membership.id);

    if (error) {
      redirect("/administration?error=soutien-confirm");
    }
  } else if (isLegacyPending) {
    const { settings } = await getAsblSettingsForCurrentYear();
    const feeCents = getSchoolSupportFeeCents(settings);

    const { data: link } = await supabase
      .from("parent_child_links")
      .select("parent_id")
      .eq("child_id", childId)
      .not("verified_at", "is", null)
      .limit(1)
      .maybeSingle<{ parent_id: string }>();

    if (!link) {
      redirect("/administration?error=soutien-not-found");
    }

    const { error } = await supabase.from("memberships").insert({
      child_id: childId,
      parent_id: link.parent_id,
      school_year: schoolYear,
      plan: "SCHOOL_SUPPORT",
      fee_cents: feeCents,
      status: "ACTIVE",
      asbl_validated_at: verifiedAt,
    } as never);

    if (error) {
      redirect("/administration?error=soutien-confirm");
    }
  }

  await supabase
    .from("children")
    .update({
      enrollment_status: "VALIDE",
      asbl_validated_at: verifiedAt,
    } as never)
    .eq("id", childId);

  await verifyParentLinkForChild(supabase, childId, verifiedAt);
  await activatePendingSchoolSupportEnrollments(supabase, childId);

  revalidatePath("/");
  revalidatePath("/administration");
  revalidatePath("/soutien-scolaire");
  revalidatePath("/espace-parents");
  revalidatePath("/espace-parents/soutien-scolaire");
  revalidatePath(`/enfants/${childId}`);
  redirect("/?success=soutien-confirmed");
}
