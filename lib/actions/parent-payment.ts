"use server";

import { redirect } from "next/navigation";
import { PaymentMethod } from "@mollie/api-client";
import { formatCentsForMollie, getAppUrl } from "@/lib/config/payments";
import { getMollieClient, isMollieConfigured } from "@/lib/mollie/client";
import {
  childNeedsMembershipPayment,
  getChildPaymentContext,
} from "@/lib/data/parent-payments";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { isParentRole } from "@/lib/auth/roles";
import type { Database } from "@/types/database";

type PayMethod = "BANCONTACT" | "CARD";

type PaymentInsert = Database["public"]["Tables"]["payments"]["Insert"];

async function markMembershipPaid(
  supabase: Awaited<ReturnType<typeof createClient>>,
  childId: string,
  membershipId: string | null
) {
  await supabase
    .from("children")
    .update({ enrollment_status: "PAYE_EN_ATTENTE_ASBL" } as never)
    .eq("id", childId);

  if (membershipId) {
    await supabase
      .from("memberships")
      .update({ status: "AWAITING_ASBL" } as never)
      .eq("id", membershipId)
      .eq("status", "AWAITING_PAYMENT");
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

  if (context.paid_payment || context.membership_status === "AWAITING_ASBL") {
    redirect("/espace-parents?success=deja-paye");
  }

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
    .insert(paymentRow as never)
    .select("id")
    .single<{ id: string }>();

  if (insertError || !inserted) {
    redirect(
      `/espace-parents/paiement/${childId}?error=db&detail=${encodeURIComponent(insertError?.message ?? "insert")}`
    );
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
      webhookUrl: `${appUrl}/api/webhooks/mollie`,
      method: mollieMethod,
      metadata: {
        child_id: childId,
        parent_id: profile.id,
        membership_id: context.membership_id,
        asblos_payment_id: inserted.id,
      },
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Erreur Mollie";
    redirect(
      `/espace-parents/paiement/${childId}?error=mollie&detail=${encodeURIComponent(detail)}`
    );
  }

  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    await admin
      .from("payments")
      .update({ provider_payment_id: molliePayment.id } as never)
      .eq("id", inserted.id);
  } catch {
    redirect(`/espace-parents/paiement/${childId}?error=db&detail=service_role`);
  }

  const checkoutUrl = molliePayment.getCheckoutUrl();
  if (!checkoutUrl) {
    redirect(`/espace-parents/paiement/${childId}?error=checkout`);
  }

  redirect(checkoutUrl);
}

export async function simulateParentPaymentAction(childId: string) {
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

  if (context.paid_payment || context.membership_status === "AWAITING_ASBL") {
    redirect("/espace-parents?success=deja-paye");
  }

  if (!childNeedsMembershipPayment(context)) {
    redirect("/espace-parents");
  }

  const supabase = await createClient();
  const feeCents = context.fee_cents;
  const paidAt = new Date().toISOString();
  const simRef = `sim_${crypto.randomUUID()}`;

  if (!context.pending_payment) {
    const paymentRow: PaymentInsert = {
      child_id: childId,
      parent_id: profile.id,
      amount_cents: feeCents,
      currency: "EUR",
      provider: "MOLLIE",
      provider_payment_id: simRef,
      method: "BANCONTACT",
      status: "PENDING",
      purpose: "MEMBERSHIP",
      reference_id: context.membership_id ?? undefined,
    };

    const { error: insertError } = await supabase
      .from("payments")
      .insert(paymentRow as never);

    if (insertError) {
      redirect(
        `/espace-parents/paiement/${childId}?error=db&detail=${encodeURIComponent(insertError.message)}`
      );
    }
  }

  await markMembershipPaid(supabase, childId, context.membership_id);

  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    const paymentId = context.pending_payment?.id;
    if (paymentId) {
      await admin
        .from("payments")
        .update({
          status: "PAID",
          paid_at: paidAt,
          method: "BANCONTACT",
          provider_payment_id: `sim_${paymentId}`,
          purpose: "MEMBERSHIP",
          reference_id: context.membership_id,
        } as never)
        .eq("id", paymentId);
    } else {
      await admin
        .from("payments")
        .update({
          status: "PAID",
          paid_at: paidAt,
          purpose: "MEMBERSHIP",
          reference_id: context.membership_id,
        } as never)
        .eq("child_id", childId)
        .eq("parent_id", profile.id)
        .eq("status", "PENDING");
    }
  } catch {
    // OK sans service role — membership + enfant mis à jour
  }

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/espace-parents");
  revalidatePath("/administration");
  revalidatePath("/paiements");
  revalidatePath("/enfants");

  redirect("/espace-parents?success=paiement");
}
