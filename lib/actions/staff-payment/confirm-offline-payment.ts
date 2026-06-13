"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth/session";
import { canRecordPayment } from "@/lib/auth/permissions";
import { logAuditEvent } from "@/lib/audit/log-audit";
import { getAuditIpHash } from "@/lib/audit/request-ip";
import { confirmBankTransferPaymentAsAdmin } from "@/lib/payments/confirm-bank-transfer-payment";
import { revalidatePaymentViews } from "@/lib/payments/parent-payment-guards";
import { guardUuid } from "@/lib/validations/uuid";
import type { Database } from "@/types/database";

type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];

async function loadPaymentForStaff(paymentId: string): Promise<PaymentRow | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .maybeSingle<PaymentRow>();
  if (error || !data) return null;
  return data;
}

function mapConfirmError(error?: string): string {
  if (error === "notfound") return "notfound";
  if (error === "proof_not_submitted") return "proof-not-submitted";
  if (error === "activity_sync") return "activity-sync";
  if (error === "membership_sync" || error?.includes("membership")) return "membership-sync";
  return "confirm-payment";
}

export async function confirmOfflinePaymentAction(paymentId: string) {
  guardUuid(paymentId, "/paiements");
  const profile = await requireProfile();
  if (!canRecordPayment(profile.role)) {
    redirect("/paiements?error=permission");
  }

  const payment = await loadPaymentForStaff(paymentId);
  if (!payment) {
    redirect("/paiements?error=notfound");
  }

  if (payment.status === "PAID") {
    redirect("/paiements?success=payment-already-paid");
  }

  const result = await confirmBankTransferPaymentAsAdmin(payment);
  if (!result.ok) {
    redirect(`/paiements?error=${mapConfirmError(result.error)}`);
  }

  if (result.alreadyPaid) {
    redirect("/paiements?success=payment-already-paid");
  }

  const ipHash = await getAuditIpHash();
  if (payment.purpose === "MEMBERSHIP") {
    await logAuditEvent({
      action: "PAYMENT_PAID",
      entityType: "children",
      entityId: payment.child_id,
      actorId: profile.id,
      actorRole: profile.role,
      metadata: {
        payment_id: paymentId,
        membership_id: payment.reference_id,
        source: "confirm_offline_payment",
        purpose: "MEMBERSHIP",
      },
      ipHash,
    });
  } else if (payment.purpose === "ACTIVITY") {
    await logAuditEvent({
      action: "PAYMENT_PAID",
      entityType: "activity_registrations",
      entityId: payment.reference_id ?? payment.id,
      actorId: profile.id,
      actorRole: profile.role,
      metadata: {
        payment_id: paymentId,
        source: "confirm_offline_payment",
        purpose: "ACTIVITY",
      },
      ipHash,
    });
  }

  await revalidatePaymentViews();
  revalidatePath("/espace-parents/activites");
  redirect("/paiements?success=payment-confirmed");
}

export async function rejectOfflinePaymentAction(paymentId: string, formData: FormData) {
  guardUuid(paymentId, "/paiements");
  const profile = await requireProfile();
  if (!canRecordPayment(profile.role)) {
    redirect("/paiements?error=permission");
  }

  const noteRaw = formData.get("rejection_note");
  const note =
    typeof noteRaw === "string" && noteRaw.trim().length > 0
      ? noteRaw.trim().slice(0, 500)
      : null;

  const payment = await loadPaymentForStaff(paymentId);
  if (!payment || payment.status !== "PROOF_SUBMITTED") {
    redirect("/paiements?error=proof-not-submitted");
  }

  const admin = createAdminClient();
  const { data: rejected, error } = await admin
    .from("payments")
    .update({
      status: "PENDING",
      proof_storage_path: null,
      proof_original_filename: null,
      proof_submitted_at: null,
      proof_rejection_note: note,
    })
    .eq("id", paymentId)
    .eq("status", "PROOF_SUBMITTED")
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error || !rejected) {
    redirect("/paiements?error=reject-payment");
  }

  const ipHash = await getAuditIpHash();
  await logAuditEvent({
    action: "PAYMENT_PROOF_REJECTED",
    entityType: "payments",
    entityId: paymentId,
    actorId: profile.id,
    actorRole: profile.role,
    metadata: {
      child_id: payment.child_id,
      note,
    },
    ipHash,
  });

  await revalidatePaymentViews();
  redirect("/paiements?success=payment-rejected");
}

export async function getPaymentProofSignedUrlAction(paymentId: string) {
  guardUuid(paymentId, "/paiements");
  const profile = await requireProfile();
  if (!canRecordPayment(profile.role)) {
    return { ok: false as const, error: "permission" };
  }

  const payment = await loadPaymentForStaff(paymentId);
  if (!payment?.proof_storage_path) {
    return { ok: false as const, error: "notfound" };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("payment-proofs")
    .createSignedUrl(payment.proof_storage_path, 120);

  if (error || !data?.signedUrl) {
    return { ok: false as const, error: "signed_url" };
  }

  return { ok: true as const, url: data.signedUrl };
}
