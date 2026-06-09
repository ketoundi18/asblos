"use server";

import { redirect } from "next/navigation";
import {
  childNeedsMembershipPayment,
  markMembershipPaidOrRedirect,
  requireChildPaymentContextOrRedirect,
  requireParentProfileOrRedirect,
  resyncPaidMembershipOrContinue,
  revalidatePaymentViews,
} from "@/lib/payments/parent-payment-guards";

export async function simulateParentPaymentAction(
  childId: string,
  formData: FormData
) {
  const wizardMode = formData.get("wizard_mode") === "1";
  const profile = await requireParentProfileOrRedirect();

  const { isPaymentSimulationEnabled } = await import("@/lib/config/payments");

  if (!isPaymentSimulationEnabled()) {
    redirect(`/espace-parents/paiement/${childId}?error=simulation`);
  }

  const context = await requireChildPaymentContextOrRedirect(childId);

  const successRedirect = wizardMode
    ? `/espace-parents/inscrire?step=termine&childId=${encodeURIComponent(childId)}`
    : "/espace-parents?success=paiement";

  await resyncPaidMembershipOrContinue(childId, context, successRedirect);

  if (!childNeedsMembershipPayment(context)) {
    redirect("/espace-parents");
  }

  const feeCents = context.fee_cents;
  const paidAt = new Date().toISOString();
  const membershipId = context.membership_id;
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  let paymentId = context.pending_payment?.id;

  if (!paymentId) {
    const simRef = `sim_${crypto.randomUUID()}`;
    const { data: inserted, error: insertError } = await admin
      .from("payments")
      .insert({
        child_id: childId,
        parent_id: profile.id,
        amount_cents: feeCents,
        currency: "EUR",
        provider: "MOLLIE",
        provider_payment_id: simRef,
        method: "BANCONTACT",
        status: "PAID",
        paid_at: paidAt,
        purpose: "MEMBERSHIP",
        reference_id: membershipId ?? undefined,
      })
      .select("id")
      .single<{ id: string }>();

    if (insertError || !inserted) {
      redirect(`/espace-parents/paiement/${childId}?error=db`);
    }
    paymentId = inserted.id;
  } else {
    const { error: updateError } = await admin
      .from("payments")
      .update({
        status: "PAID",
        paid_at: paidAt,
        method: "BANCONTACT",
        provider_payment_id: `sim_${paymentId}`,
        purpose: "MEMBERSHIP",
        reference_id: membershipId,
      })
      .eq("id", paymentId);

    if (updateError) {
      redirect(`/espace-parents/paiement/${childId}?error=db`);
    }
  }

  await markMembershipPaidOrRedirect(
    childId,
    membershipId,
    `/espace-parents/paiement/${childId}?error=membership-paid`
  );

  await revalidatePaymentViews();

  redirect(successRedirect);
}
