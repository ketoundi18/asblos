"use server";

import { redirect } from "next/navigation";
import { PaymentMethod } from "@mollie/api-client";
import { formatCentsForMollie, getAppUrl } from "@/lib/config/payments";
import { buildMollieWebhookUrl } from "@/lib/payments/mollie-webhook";
import { getMollieClient, isMollieConfigured } from "@/lib/mollie/client";
import {
  childNeedsMembershipPayment,
  resyncPaidMembershipOrContinue,
  requireChildPaymentContextOrRedirect,
  requireParentProfileOrRedirect,
} from "@/lib/payments/parent-payment-guards";
import { guardChildId } from "@/lib/validations/uuid";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type PayMethod = "BANCONTACT" | "CARD";
type PaymentInsert = Database["public"]["Tables"]["payments"]["Insert"];

export async function startParentPaymentAction(
  childId: string,
  method: PayMethod
) {
  guardChildId(childId, "/espace-parents");
  const profile = await requireParentProfileOrRedirect();

  if (!isMollieConfigured()) {
    redirect(`/espace-parents/paiement/${childId}?error=config`);
  }

  const context = await requireChildPaymentContextOrRedirect(childId);

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
  } catch {
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
