import { PaymentMethod } from "@mollie/api-client";
import { getMollieClient } from "@/lib/mollie/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/audit/log-audit";
import { syncEnrollmentPaid } from "@/lib/payments/sync-enrollment-paid";
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
      if (payment.purpose === "MEMBERSHIP" || !payment.purpose) {
        const synced = await syncEnrollmentPaid(
          payment.child_id,
          payment.reference_id
        );
        if (!synced.ok) {
          return { ok: false, error: synced.error };
        }
      }
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
      })
      .eq("id", payment.id);

    if (updateError) {
      return { ok: false, error: updateError.message };
    }

    if (nextStatus === "PAID") {
      if (payment.purpose === "MEMBERSHIP" || !payment.purpose) {
        const synced = await syncEnrollmentPaid(
          payment.child_id,
          payment.reference_id
        );
        if (!synced.ok) {
          return { ok: false, error: synced.error };
        }
      }

      await logAuditEvent({
        action: "PAYMENT_PAID",
        entityType: "payments",
        entityId: payment.id,
        metadata: {
          child_id: payment.child_id,
          provider_payment_id: molliePaymentId,
          purpose: payment.purpose,
          reference_id: payment.reference_id,
          source: "mollie_webhook",
        },
      });
    }

    if (nextStatus === "FAILED") {
      await logAuditEvent({
        action: "PAYMENT_FAILED",
        entityType: "payments",
        entityId: payment.id,
        metadata: {
          child_id: payment.child_id,
          provider_payment_id: molliePaymentId,
          source: "mollie_webhook",
        },
      });
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
