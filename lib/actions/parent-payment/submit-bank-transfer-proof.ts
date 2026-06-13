"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isBankTransferConfigured } from "@/lib/asbl/fee-utils";
import { getAsblSettingsForCurrentYear } from "@/lib/data/asbl-settings";
import { logAuditEvent } from "@/lib/audit/log-audit";
import { getAuditIpHash } from "@/lib/audit/request-ip";
import {
  buildProofStoragePath,
  validateProofFile,
} from "@/lib/payments/proof-upload";
import { ensureBankTransferPayment } from "@/lib/payments/ensure-bank-transfer-payment";
import { resolveActivityBankDetails } from "@/lib/payments/resolve-bank-details";
import {
  requireChildPaymentContextOrRedirect,
  requireParentProfileOrRedirect,
  revalidatePaymentViews,
} from "@/lib/payments/parent-payment-guards";
import { guardChildId, isValidUuid } from "@/lib/validations/uuid";
import type { Database } from "@/types/database";

type PaymentPurpose = Database["public"]["Enums"]["payment_purpose"];

function proofErrorRedirect(childId: string, code: string, wizard?: boolean): never {
  const qs = wizard ? "?error=" + code + "&wizard=1" : "?error=" + code;
  redirect(`/espace-parents/paiement/${childId}${qs}`);
}

export async function submitMembershipBankTransferProofAction(
  childId: string,
  formData: FormData
) {
  guardChildId(childId, "/espace-parents");
  const profile = await requireParentProfileOrRedirect();
  const wizardMode = formData.get("wizard") === "1";

  const context = await requireChildPaymentContextOrRedirect(childId);
  if (context.paid_payment || context.membership_status === "AWAITING_ASBL") {
    redirect("/espace-parents?success=deja-paye");
  }

  const { settings } = await getAsblSettingsForCurrentYear();
  if (!isBankTransferConfigured(settings)) {
    proofErrorRedirect(childId, "bank-not-configured", wizardMode);
  }

  const proofFile = formData.get("proof");
  if (!(proofFile instanceof File)) {
    proofErrorRedirect(childId, "proof-missing", wizardMode);
  }

  const validation = validateProofFile(proofFile);
  if (!validation.ok) {
    proofErrorRedirect(childId, validation.error, wizardMode);
  }

  const prepared = await ensureBankTransferPayment({
    childId,
    parentId: profile.id,
    amountCents: context.fee_cents,
    purpose: "MEMBERSHIP",
    referenceId: context.membership_id,
  });

  if (!prepared.ok) {
    proofErrorRedirect(childId, "proof-save", wizardMode);
  }

  const payment = prepared.draft.payment;
  if (payment.status === "PROOF_SUBMITTED") {
    const successQs = wizardMode ? "?success=proof-pending&wizard=1" : "?success=proof-pending";
    redirect(`/espace-parents/paiement/${childId}${successQs}`);
  }

  if (payment.status === "PAID") {
    redirect("/espace-parents?success=deja-paye");
  }

  const storagePath = buildProofStoragePath(
    payment.id,
    `${Date.now()}-${validation.safeBaseName}`
  );

  const supabase = await createClient();
  const fileBuffer = Buffer.from(await proofFile.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from("payment-proofs")
    .upload(storagePath, fileBuffer, {
      contentType: validation.mime,
      upsert: false,
    });

  if (uploadError) {
    proofErrorRedirect(childId, "proof-upload", wizardMode);
  }

  const admin = createAdminClient();
  const { data: updated, error: updateError } = await admin
    .from("payments")
    .update({
      status: "PROOF_SUBMITTED",
      proof_storage_path: storagePath,
      proof_original_filename: validation.safeBaseName,
      proof_submitted_at: new Date().toISOString(),
      proof_rejection_note: null,
    })
    .eq("id", payment.id)
    .in("status", ["PENDING", "PROOF_SUBMITTED"])
    .select("id")
    .maybeSingle<{ id: string }>();

  if (updateError || !updated) {
    await admin.storage.from("payment-proofs").remove([storagePath]);
    proofErrorRedirect(childId, "proof-save", wizardMode);
  }

  const ipHash = await getAuditIpHash();
  await logAuditEvent({
    action: "PAYMENT_PROOF_SUBMITTED",
    entityType: "payments",
    entityId: payment.id,
    actorId: profile.id,
    actorRole: profile.role,
    metadata: {
      child_id: childId,
      purpose: "MEMBERSHIP" satisfies PaymentPurpose,
      amount_cents: context.fee_cents,
    },
    ipHash,
  });

  await revalidatePaymentViews();
  const successQs = wizardMode ? "?success=proof-submitted&wizard=1" : "?success=proof-submitted";
  redirect(`/espace-parents/paiement/${childId}${successQs}`);
}

export async function submitActivityBankTransferProofAction(
  activityId: string,
  childId: string,
  formData: FormData
) {
  if (!isValidUuid(activityId) || !isValidUuid(childId)) {
    redirect("/espace-parents/activites?error=payment");
  }

  const profile = await requireParentProfileOrRedirect();
  const supabase = await createClient();

  const { data: registration } = await supabase
    .from("activity_registrations")
    .select("id, payment_status, activity_id, child_id")
    .eq("activity_id", activityId)
    .eq("child_id", childId)
    .eq("registered_by", profile.id)
    .maybeSingle<{
      id: string;
      payment_status: string;
      activity_id: string;
      child_id: string;
    }>();

  if (!registration || registration.payment_status === "PAID") {
    redirect(`/espace-parents/activites/${activityId}?error=payment`);
  }

  const { data: activity } = await supabase
    .from("activities")
    .select(
      "price_cents, title, payment_bank_iban, payment_bank_account_holder, payment_transfer_reference"
    )
    .eq("id", activityId)
    .maybeSingle<{
      price_cents: number;
      title: string;
      payment_bank_iban: string | null;
      payment_bank_account_holder: string | null;
      payment_transfer_reference: string | null;
    }>();

  const priceCents = activity?.price_cents ?? 0;
  const { settings } = await getAsblSettingsForCurrentYear();
  const bankDetails = activity
    ? resolveActivityBankDetails(activity, settings)
    : null;

  if (priceCents <= 0 || !bankDetails) {
    redirect(
      `/espace-parents/paiement-activite/${activityId}/${childId}?error=bank-not-configured`
    );
  }

  const proofFile = formData.get("proof");
  if (!(proofFile instanceof File)) {
    redirect(
      `/espace-parents/paiement-activite/${activityId}/${childId}?error=proof-missing`
    );
  }

  const validation = validateProofFile(proofFile);
  if (!validation.ok) {
    redirect(
      `/espace-parents/paiement-activite/${activityId}/${childId}?error=${validation.error}`
    );
  }

  const prepared = await ensureBankTransferPayment({
    childId,
    parentId: profile.id,
    amountCents: priceCents,
    purpose: "ACTIVITY",
    referenceId: registration.id,
    transferReferenceOverride: bankDetails.transferReference,
  });

  if (!prepared.ok) {
    redirect(
      `/espace-parents/paiement-activite/${activityId}/${childId}?error=proof-save`
    );
  }

  const payment = prepared.draft.payment;
  if (payment.status === "PROOF_SUBMITTED") {
    redirect(
      `/espace-parents/paiement-activite/${activityId}/${childId}?success=proof-pending`
    );
  }

  const storagePath = buildProofStoragePath(
    payment.id,
    `${Date.now()}-${validation.safeBaseName}`
  );

  const fileBuffer = Buffer.from(await proofFile.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from("payment-proofs")
    .upload(storagePath, fileBuffer, {
      contentType: validation.mime,
      upsert: false,
    });

  if (uploadError) {
    redirect(
      `/espace-parents/paiement-activite/${activityId}/${childId}?error=proof-upload`
    );
  }

  const admin = createAdminClient();
  const { data: updated, error: updateError } = await admin
    .from("payments")
    .update({
      status: "PROOF_SUBMITTED",
      proof_storage_path: storagePath,
      proof_original_filename: validation.safeBaseName,
      proof_submitted_at: new Date().toISOString(),
      proof_rejection_note: null,
    })
    .eq("id", payment.id)
    .in("status", ["PENDING", "PROOF_SUBMITTED"])
    .select("id")
    .maybeSingle<{ id: string }>();

  if (updateError || !updated) {
    await admin.storage.from("payment-proofs").remove([storagePath]);
    redirect(
      `/espace-parents/paiement-activite/${activityId}/${childId}?error=proof-save`
    );
  }

  const ipHash = await getAuditIpHash();
  await logAuditEvent({
    action: "PAYMENT_PROOF_SUBMITTED",
    entityType: "payments",
    entityId: payment.id,
    actorId: profile.id,
    actorRole: profile.role,
    metadata: {
      child_id: childId,
      activity_id: activityId,
      purpose: "ACTIVITY",
      amount_cents: priceCents,
    },
    ipHash,
  });

  revalidatePath("/espace-parents/activites");
  revalidatePath(`/espace-parents/activites/${activityId}`);
  revalidatePath("/paiements");
  redirect(
    `/espace-parents/paiement-activite/${activityId}/${childId}?success=proof-submitted`
  );
}
