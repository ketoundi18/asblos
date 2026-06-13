import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { markMembershipPaidAsAdmin } from "@/lib/payments/mark-membership-paid";
import type { Database } from "@/types/database";

type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];

async function markActivityRegistrationPaid(
  registrationId: string | null
): Promise<{ ok: boolean; error?: string }> {
  if (!registrationId) {
    return { ok: false, error: "registration_missing" };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("activity_registrations")
    .update({ payment_status: "PAID" })
    .eq("id", registrationId)
    .in("payment_status", ["PENDING", "DEFERRED"])
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!data) {
    return { ok: false, error: "activity_registration_not_updated" };
  }
  return { ok: true };
}

async function revertPaymentToProofSubmitted(paymentId: string): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("payments")
    .update({
      status: "PROOF_SUBMITTED",
      paid_at: null,
    })
    .eq("id", paymentId)
    .eq("status", "PAID");
}

/** Fallback TS si migration 051 pas encore appliquée — rollback PAID si sync échoue. */
async function confirmBankTransferPaymentFallback(
  payment: PaymentRow
): Promise<{ ok: boolean; error?: string; alreadyPaid?: boolean }> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: paidRow, error: payError } = await admin
    .from("payments")
    .update({
      status: "PAID",
      paid_at: now,
      proof_rejection_note: null,
    })
    .eq("id", payment.id)
    .eq("status", "PROOF_SUBMITTED")
    .select("id")
    .maybeSingle<{ id: string }>();

  if (payError) {
    return { ok: false, error: payError.message };
  }
  if (!paidRow) {
    return { ok: false, error: "confirm_payment_no_row" };
  }

  if (payment.purpose === "MEMBERSHIP") {
    const synced = await markMembershipPaidAsAdmin(
      payment.child_id,
      payment.reference_id
    );
    if (!synced.ok) {
      await revertPaymentToProofSubmitted(payment.id);
      return { ok: false, error: synced.error ?? "membership_sync" };
    }
  } else if (payment.purpose === "ACTIVITY") {
    const activitySynced = await markActivityRegistrationPaid(payment.reference_id);
    if (!activitySynced.ok) {
      await revertPaymentToProofSubmitted(payment.id);
      return { ok: false, error: activitySynced.error ?? "activity_sync" };
    }
  }

  return { ok: true };
}

function isMissingConfirmRpc(errorMessage: string): boolean {
  return (
    errorMessage.includes("Could not find the function") ||
    errorMessage.includes("confirm_bank_transfer_payment")
  );
}

/** Confirme un virement staff (RPC atomique 051, sinon fallback avec rollback). */
export async function confirmBankTransferPaymentAsAdmin(
  payment: PaymentRow
): Promise<{ ok: boolean; error?: string; alreadyPaid?: boolean }> {
  if (payment.status === "PAID") {
    return { ok: true, alreadyPaid: true };
  }

  if (payment.status !== "PROOF_SUBMITTED") {
    return { ok: false, error: "proof_not_submitted" };
  }

  const admin = createAdminClient();
  const { error: rpcError } = await admin.rpc("confirm_bank_transfer_payment", {
    p_payment_id: payment.id,
  });

  if (!rpcError) {
    return { ok: true };
  }

  const message = rpcError.message ?? "confirm_rpc_failed";
  if (isMissingConfirmRpc(message)) {
    return confirmBankTransferPaymentFallback(payment);
  }

  if (message.includes("not_found")) {
    return { ok: false, error: "notfound" };
  }
  if (message.includes("proof_not_submitted")) {
    return { ok: false, error: "proof_not_submitted" };
  }
  if (message.includes("activity_registration_not_updated")) {
    return { ok: false, error: "activity_sync" };
  }
  if (
    message.includes("payment_not_confirmed") ||
    message.includes("membership_required")
  ) {
    return { ok: false, error: "membership_sync" };
  }

  return { ok: false, error: message };
}
