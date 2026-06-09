"use server";

import { redirect } from "next/navigation";
import { PaymentMethod } from "@mollie/api-client";
import { formatCentsForMollie, getAppUrl } from "@/lib/config/payments";
import { buildMollieWebhookUrl } from "@/lib/payments/mollie-webhook";
import { getMollieClient, isMollieConfigured } from "@/lib/mollie/client";
import {
  childNeedsMembershipPayment,
  getChildPaymentContext,
} from "@/lib/data/parent-payments";
import { markMembershipPaidAsAdmin } from "@/lib/payments/mark-membership-paid";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { isParentRole } from "@/lib/auth/roles";
import type { Database } from "@/types/database";

type PayMethod = "BANCONTACT" | "CARD";

type PaymentInsert = Database["public"]["Tables"]["payments"]["Insert"];

async function revalidatePaymentViews() {
  const { revalidatePath } = await import("next/cache");
  revalidatePath("/espace-parents");
  revalidatePath("/administration");
  revalidatePath("/paiements");
  revalidatePath("/enfants");
}

/** Paiement PAID mais adhésion pas encore synchronisée → resync avant de continuer. */
async function resyncPaidMembershipOrContinue(
  childId: string,
  context: Awaited<ReturnType<typeof getChildPaymentContext>> & object,
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

export async function startParentPaymentAction(
  childId: string,
  method: PayMethod
) {
  const profile = await requireProfile();

  if (!isParentRole(profile.role)) {
    redirect("/espace-parents/connexion");
  }

  if (!isMollieConfigured()) {
    redirect(`/espace-parents/paiement/${childId}?error=config`);
  }

  const context = await getChildPaymentContext(childId);

  if (!context) {
    redirect("/espace-parents?error=payment");
  }

  await resyncPaidMembershipOrContinue(
    childId,
    context,
    "/espace-parents?success=deja-paye"
  );

  if (!childNeedsMembershipPayment(context)) {
    redirect("/espace-parents");
  }

  const supabase = await createClient();
  const feeCents = context.fee_cents;
  const appUrl = getAppUrl();

  if (context.pending_payment?.provider_payment_id) {
    try {
      const mollie = getMollieClient();
      const existing = await mollie.payments.get(
        context.pending_payment.provider_payment_id
      );
      if (existing.status === "open" || existing.status === "pending") {
        const checkoutUrl = existing.getCheckoutUrl();
        if (checkoutUrl) redirect(checkoutUrl);
      }
    } catch {
      // On recrée un paiement si l'ancien est invalide
    }
  }

  const paymentRow: PaymentInsert = {
    child_id: childId,
    parent_id: profile.id,
    amount_cents: feeCents,
    currency: "EUR",
    provider: "MOLLIE",
    method: method === "BANCONTACT" ? "BANCONTACT" : "CARD",
    status: "PENDING",
    purpose: "MEMBERSHIP",
    reference_id: context.membership_id ?? undefined,
  };

  const { data: inserted, error: insertError } = await supabase
    .from("payments")
    .insert(paymentRow)
    .select("id")
    .single<{ id: string }>();

  if (insertError || !inserted) {
    redirect(`/espace-parents/paiement/${childId}?error=db`);
  }

  const mollieMethod =
    method === "BANCONTACT" ? PaymentMethod.bancontact : PaymentMethod.creditcard;

  const description = `Cotisation ASBL — ${context.first_name} ${context.last_name}`;

  let molliePayment;
  try {
    const mollie = getMollieClient();
    molliePayment = await mollie.payments.create({
      amount: {
        currency: "EUR",
        value: formatCentsForMollie(feeCents),
      },
      description,
      redirectUrl: `${appUrl}/espace-parents/paiement/retour?ref=${inserted.id}`,
      webhookUrl: buildMollieWebhookUrl(appUrl),
      method: mollieMethod,
      metadata: {
        child_id: childId,
        parent_id: profile.id,
        membership_id: context.membership_id,
        asblos_payment_id: inserted.id,
      },
    });
  } catch (err) {
    void err;
    redirect(`/espace-parents/paiement/${childId}?error=mollie`);
  }

  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    await admin
      .from("payments")
      .update({ provider_payment_id: molliePayment.id })
      .eq("id", inserted.id);
  } catch {
    redirect(`/espace-parents/paiement/${childId}?error=db`);
  }

  const checkoutUrl = molliePayment.getCheckoutUrl();
  if (!checkoutUrl) {
    redirect(`/espace-parents/paiement/${childId}?error=checkout`);
  }

  redirect(checkoutUrl);
}

export async function simulateParentPaymentAction(
  childId: string,
  formData: FormData
) {
  const wizardMode = formData.get("wizard_mode") === "1";
  const profile = await requireProfile();

  if (!isParentRole(profile.role)) {
    redirect("/espace-parents/connexion");
  }

  const { isPaymentSimulationEnabled } = await import("@/lib/config/payments");

  if (!isPaymentSimulationEnabled()) {
    redirect(`/espace-parents/paiement/${childId}?error=simulation`);
  }

  const context = await getChildPaymentContext(childId);

  if (!context) {
    redirect("/espace-parents?error=payment");
  }

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

  const paid = await markMembershipPaidAsAdmin(childId, membershipId);
  if (!paid.ok) {
    redirect(`/espace-parents/paiement/${childId}?error=membership-paid`);
  }

  await revalidatePaymentViews();

  redirect(successRedirect);
}
