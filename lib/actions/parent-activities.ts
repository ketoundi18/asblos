"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { isParentRole } from "@/lib/auth/roles";
import { getChildEnrollmentState } from "@/lib/enrollment/get-child-enrollment-state";
import { resolveActivityRegistrationEligibilityFromState } from "@/lib/parent/activity-eligibility";
import type { ActivityRegistrationPaymentStatus } from "@/types/activity";
import { isActivityPaid } from "@/types/activity";
import { guardUuid, isValidUuid } from "@/lib/validations/uuid";

function resolvePaymentStatus(
  priceCents: number,
  paymentTiming: string | null
): ActivityRegistrationPaymentStatus {
  if (!isActivityPaid(priceCents)) {
    return "NOT_REQUIRED";
  }
  if (paymentTiming === "now") {
    return "PENDING";
  }
  return "DEFERRED";
}

export async function registerParentChildToActivityAction(
  activityId: string,
  formData: FormData
) {
  guardUuid(activityId, "/espace-parents/activites");
  const profile = await requireProfile();

  if (!isParentRole(profile.role)) {
    redirect(`/espace-parents/activites/${activityId}?error=permission`);
  }

  const childId = formData.get("child_id");
  if (typeof childId !== "string" || !childId || !isValidUuid(childId)) {
    redirect(`/espace-parents/activites/${activityId}?error=child`);
  }

  const paymentTiming = formData.get("payment_timing");
  const timing =
    typeof paymentTiming === "string" ? paymentTiming : "defer";

  const supabase = await createClient();

  const { data: activity } = await supabase
    .from("activities")
    .select("price_cents, max_participants, parent_registration_open")
    .eq("id", activityId)
    .single<{
      price_cents: number;
      max_participants: number | null;
      parent_registration_open: boolean;
    }>();

  if (!activity?.parent_registration_open) {
    redirect(`/espace-parents/activites/${activityId}?error=closed`);
  }

  const { data: link } = await supabase
    .from("parent_child_links")
    .select("id")
    .eq("parent_id", profile.id)
    .eq("child_id", childId)
    .not("verified_at", "is", null)
    .maybeSingle();

  if (!link) {
    redirect(`/espace-parents/activites/${activityId}?error=not-verified`);
  }

  const { state, loadError } = await getChildEnrollmentState(childId);
  if (loadError || !state) {
    redirect(`/espace-parents/activites/${activityId}?error=cotisation-pending`);
  }

  const eligibility = resolveActivityRegistrationEligibilityFromState(state);
  if (!eligibility.allowed) {
    const errorCode =
      eligibility.reason === "awaiting_payment"
        ? "cotisation"
        : eligibility.reason === "rejected"
          ? "cotisation-refused"
          : "cotisation-pending";
    redirect(`/espace-parents/activites/${activityId}?error=${errorCode}`);
  }

  const priceCents = activity.price_cents ?? 0;
  const paymentStatus = resolvePaymentStatus(priceCents, timing);

  const { error } = await supabase.from("activity_registrations").insert({
    activity_id: activityId,
    child_id: childId,
    registered_by: profile.id,
    payment_status: paymentStatus,
  });

  if (error) {
    if (error.message.includes("payment_status")) {
      redirect(`/espace-parents/activites/${activityId}?error=migration`);
    }
    redirect(`/espace-parents/activites/${activityId}?error=inscription`);
  }

  revalidatePath("/espace-parents/activites");
  revalidatePath(`/espace-parents/activites/${activityId}`);
  revalidatePath("/espace-parents");

  if (paymentStatus === "PENDING") {
    redirect(`/espace-parents/paiement-activite/${activityId}/${childId}`);
  }

  redirect(`/espace-parents/activites/${activityId}?success=inscription`);
}
