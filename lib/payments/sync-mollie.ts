import { PaymentMethod } from "@mollie/api-client";
import { getMollieClient } from "@/lib/mollie/client";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type PaymentStatus = Database["public"]["Enums"]["payment_status"];
type PaymentMethodDb = Database["public"]["Enums"]["payment_method"];

function mapMollieMethod(method: string | null | undefined): PaymentMethodDb | null {
  if (method === PaymentMethod.bancontact) return "BANCONTACT";
  if (method === PaymentMethod.creditcard) return "CARD";
  if (method) return "OTHER";
  return null;
}

function mapMollieStatus(
  mollieStatus: string
): PaymentStatus | "unchanged" {
  if (mollieStatus === "paid") return "PAID";
  if (["failed", "canceled", "expired"].includes(mollieStatus)) return "FAILED";
  return "unchanged";
}

export async function syncMolliePaymentByProviderId(
  molliePaymentId: string
): Promise<{ ok: boolean; status?: PaymentStatus; error?: string }> {
  try {
    const mollie = getMollieClient();
    const molliePayment = await mollie.payments.get(molliePaymentId);
    const admin = createAdminClient();

    const { data: payment, error: fetchError } = await admin
      .from("payments")
      .select("id, child_id, status, reference_id, purpose")
      .eq("provider_payment_id", molliePaymentId)
      .maybeSingle<{
        id: string;
        child_id: string;
        status: PaymentStatus;
        reference_id: string | null;
        purpose: string | null;
      }>();

    if (fetchError || !payment) {
      return { ok: false, error: "Paiement introuvable en base." };
    }

    if (payment.status === "PAID") {
      return { ok: true, status: "PAID" };
    }

    const nextStatus = mapMollieStatus(molliePayment.status);
    if (nextStatus === "unchanged") {
      return { ok: true, status: "PENDING" };
    }

    const method = mapMollieMethod(molliePayment.method ?? undefined);
    const paidAt =
      nextStatus === "PAID" && molliePayment.paidAt
        ? new Date(molliePayment.paidAt).toISOString()
        : nextStatus === "PAID"
          ? new Date().toISOString()
          : null;

    const { error: updateError } = await admin
      .from("payments")
      .update({
        status: nextStatus,
        paid_at: paidAt,
        method,
      } as never)
      .eq("id", payment.id);

    if (updateError) {
      return { ok: false, error: updateError.message };
    }

    if (nextStatus === "PAID") {
      await admin
        .from("children")
        .update({ enrollment_status: "PAYE_EN_ATTENTE_ASBL" } as never)
        .eq("id", payment.child_id);

      if (
        payment.reference_id &&
        (payment.purpose === "MEMBERSHIP" || !payment.purpose)
      ) {
        await admin
          .from("memberships")
          .update({ status: "AWAITING_ASBL" } as never)
          .eq("id", payment.reference_id)
          .eq("status", "AWAITING_PAYMENT");
      }
    }

    return { ok: true, status: nextStatus };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur Mollie inconnue";
    return { ok: false, error: message };
  }
}

export async function syncMolliePaymentByInternalId(
  internalPaymentId: string
): Promise<{ ok: boolean; status?: PaymentStatus; error?: string }> {
  const admin = createAdminClient();

  const { data: payment } = await admin
    .from("payments")
    .select("provider_payment_id, status")
    .eq("id", internalPaymentId)
    .maybeSingle<{ provider_payment_id: string | null; status: PaymentStatus }>();

  if (!payment?.provider_payment_id) {
    return { ok: false, error: "Paiement sans référence Mollie." };
  }

  return syncMolliePaymentByProviderId(payment.provider_payment_id);
}
