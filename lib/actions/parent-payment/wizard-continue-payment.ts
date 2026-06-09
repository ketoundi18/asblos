"use server";

import { redirect } from "next/navigation";
import { isMollieConfigured } from "@/lib/mollie/client";
import {
  childNeedsMembershipPayment,
  getChildPaymentContext,
} from "@/lib/data/parent-payments";
import {
  markMembershipPaidOrRedirect,
  requireChildPaymentContextOrRedirect,
  requireParentProfileOrRedirect,
  revalidatePaymentViews,
} from "@/lib/payments/parent-payment-guards";

/** Vérifie en base (ou sync Mollie) avant l'étape « terminé » du wizard. */
export async function continueEnrollmentWizardAfterPaymentAction(
  childId: string,
  _formData: FormData
) {
  await requireParentProfileOrRedirect();

  const context = await requireChildPaymentContextOrRedirect(childId);

  const wizardDone = `/espace-parents/inscrire?step=termine&childId=${encodeURIComponent(childId)}`;
  const wizardPayment = `/espace-parents/inscrire?step=paiement&childId=${encodeURIComponent(childId)}`;

  if (!childNeedsMembershipPayment(context)) {
    redirect(wizardDone);
  }

  if (
    context.membership_status === "AWAITING_ASBL" ||
    context.paid_payment
  ) {
    if (
      context.paid_payment &&
      context.membership_status === "AWAITING_PAYMENT"
    ) {
      await markMembershipPaidOrRedirect(
        childId,
        context.membership_id,
        `${wizardPayment}&error=membership-paid`
      );
      await revalidatePaymentViews();
    }
    redirect(wizardDone);
  }

  if (
    context.pending_payment?.provider_payment_id &&
    isMollieConfigured()
  ) {
    const { syncMolliePaymentByProviderId } = await import(
      "@/lib/payments/sync-mollie"
    );
    await syncMolliePaymentByProviderId(
      context.pending_payment.provider_payment_id
    );
    const refreshed = await getChildPaymentContext(childId);
    if (refreshed && !childNeedsMembershipPayment(refreshed)) {
      redirect(wizardDone);
    }
    if (
      refreshed?.paid_payment &&
      refreshed.membership_status === "AWAITING_PAYMENT"
    ) {
      await markMembershipPaidOrRedirect(
        childId,
        refreshed.membership_id,
        `${wizardPayment}&error=membership-paid`
      );
      await revalidatePaymentViews();
      redirect(wizardDone);
    }
  }

  redirect(`${wizardPayment}&error=payment-required`);
}
