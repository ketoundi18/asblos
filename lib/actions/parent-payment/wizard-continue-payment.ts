"use server";

import { redirect } from "next/navigation";
import {
  childNeedsMembershipPayment,
  getChildPaymentContext,
  parentMembershipPaymentSettled,
} from "@/lib/data/parent-payments";
import {
  markMembershipPaidOrRedirect,
  requireChildPaymentContextOrRedirect,
  requireParentProfileOrRedirect,
  revalidatePaymentViews,
} from "@/lib/payments/parent-payment-guards";
import { guardChildId } from "@/lib/validations/uuid";

/** Passe à l'étape « terminé » si preuve envoyée ou paiement confirmé (virement, sans Mollie). */
export async function continueEnrollmentWizardAfterPaymentAction(childId: string) {
  guardChildId(childId, "/espace-parents");
  await requireParentProfileOrRedirect();

  const context = await requireChildPaymentContextOrRedirect(childId);

  const wizardDone = `/espace-parents/inscrire?step=termine&childId=${encodeURIComponent(childId)}`;
  const wizardPayment = `/espace-parents/inscrire?step=paiement&childId=${encodeURIComponent(childId)}`;

  if (!childNeedsMembershipPayment(context)) {
    redirect(wizardDone);
  }

  if (parentMembershipPaymentSettled(context)) {
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

  redirect(`${wizardPayment}&error=payment-required`);
}
