import "server-only";

import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/session";
import { isParentRole } from "@/lib/auth/roles";
import {
  childNeedsMembershipPayment,
  getChildPaymentContext,
  type ChildPaymentContext,
} from "@/lib/data/parent-payments";
import { markMembershipPaidAsAdmin } from "@/lib/payments/mark-membership-paid";

export async function revalidatePaymentViews() {
  const { revalidatePath } = await import("next/cache");
  revalidatePath("/espace-parents");
  revalidatePath("/administration");
  revalidatePath("/paiements");
  revalidatePath("/enfants");
}

/** Parent actif uniquement — sinon redirection connexion. */
export async function requireParentProfileOrRedirect() {
  const profile = await requireProfile();
  if (!isParentRole(profile.role)) {
    redirect("/espace-parents/connexion");
  }
  return profile;
}

/** Contexte paiement pour un enfant du parent — sinon redirection. */
export async function requireChildPaymentContextOrRedirect(
  childId: string,
  notFoundRedirect = "/espace-parents?error=payment"
): Promise<ChildPaymentContext> {
  const context = await getChildPaymentContext(childId);
  if (!context) {
    redirect(notFoundRedirect);
  }
  return context;
}

/** Paiement PAID mais adhésion pas encore synchronisée → resync avant de continuer. */
export async function resyncPaidMembershipOrContinue(
  childId: string,
  context: ChildPaymentContext,
  successRedirect: string
): Promise<void> {
  if (context.membership_status === "AWAITING_ASBL") {
    redirect("/espace-parents?success=deja-paye");
  }

  if (
    context.paid_payment &&
    context.membership_status === "AWAITING_PAYMENT"
  ) {
    const resync = await markMembershipPaidAsAdmin(
      childId,
      context.membership_id
    );
    if (!resync.ok) {
      redirect(`/espace-parents/paiement/${childId}?error=membership-paid`);
    }
    await revalidatePaymentViews();
    redirect(successRedirect);
  }

  if (context.paid_payment) {
    redirect("/espace-parents?success=deja-paye");
  }
}

/** Marque l'adhésion payée après sync — échec explicite si la base refuse. */
export async function markMembershipPaidOrRedirect(
  childId: string,
  membershipId: string | null,
  errorRedirect: string
): Promise<void> {
  const paid = await markMembershipPaidAsAdmin(childId, membershipId);
  if (!paid.ok) {
    redirect(errorRedirect);
  }
}

export { childNeedsMembershipPayment };
