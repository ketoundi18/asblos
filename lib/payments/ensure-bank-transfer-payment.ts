import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentSchoolYear } from "@/lib/school-year";
import {
  buildActivityPaymentTransferReference,
  buildTransferReference,
} from "@/lib/payments/transfer-reference";
import type { Database } from "@/types/database";

type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];
type PaymentInsert = Database["public"]["Tables"]["payments"]["Insert"];
type PaymentPurpose = Database["public"]["Enums"]["payment_purpose"];

export type BankTransferPaymentDraft = {
  payment: PaymentRow;
  transferReference: string;
};

function storedTransferReference(params: {
  purpose: PaymentPurpose;
  childId: string;
  paymentId: string;
  activityReferenceOverride?: string | null;
}): string {
  const activityRef = params.activityReferenceOverride?.trim().toUpperCase() ?? null;
  if (params.purpose === "ACTIVITY" && activityRef) {
    return buildActivityPaymentTransferReference({
      activityReference: activityRef,
      childId: params.childId,
      paymentId: params.paymentId,
    });
  }
  return buildTransferReference({
    schoolYear: getCurrentSchoolYear(),
    childId: params.childId,
    purpose: params.purpose,
    paymentId: params.paymentId,
  });
}

async function parentOwnsChild(
  supabase: Awaited<ReturnType<typeof createClient>>,
  childId: string,
  parentId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("parent_child_links")
    .select("child_id")
    .eq("child_id", childId)
    .eq("parent_id", parentId)
    .maybeSingle();
  return !!data;
}

function findRelevantPayment(
  rows: PaymentRow[],
  purpose: PaymentPurpose,
  referenceId: string | null
): PaymentRow | null {
  const filtered = rows.filter(
    (p) =>
      p.purpose === purpose &&
      (referenceId ? p.reference_id === referenceId : true) &&
      p.provider === "MANUAL"
  );
  return (
    filtered.find((p) => p.status === "PROOF_SUBMITTED") ??
    filtered.find((p) => p.status === "PENDING") ??
    null
  );
}

/** Prépare ou récupère un paiement virement PENDING pour affichage IBAN + communication. */
export async function ensureBankTransferPayment(params: {
  childId: string;
  parentId: string;
  amountCents: number;
  purpose: PaymentPurpose;
  referenceId: string | null;
  transferReferenceOverride?: string | null;
}): Promise<{ ok: true; draft: BankTransferPaymentDraft } | { ok: false; error: string }> {
  const supabase = await createClient();
  const ownsChild = await parentOwnsChild(supabase, params.childId, params.parentId);
  if (!ownsChild) {
    return { ok: false, error: "forbidden" };
  }

  const { data: existingRows, error: listError } = await supabase
    .from("payments")
    .select("*")
    .eq("child_id", params.childId)
    .eq("parent_id", params.parentId)
    .order("created_at", { ascending: false });

  if (listError) {
    return { ok: false, error: listError.message };
  }

  const rows = (existingRows ?? []) as PaymentRow[];
  const paid = rows.find(
    (p) =>
      p.purpose === params.purpose &&
      p.reference_id === params.referenceId &&
      p.status === "PAID"
  );
  if (paid) {
    return {
      ok: true,
      draft: {
        payment: paid,
        transferReference: paid.transfer_reference ?? "",
      },
    };
  }

  const activityRefOverride = params.transferReferenceOverride?.trim() ?? null;

  const existing = findRelevantPayment(rows, params.purpose, params.referenceId);
  if (existing) {
    const desiredRef = storedTransferReference({
      purpose: params.purpose,
      childId: params.childId,
      paymentId: existing.id,
      activityReferenceOverride: activityRefOverride,
    });

    if (existing.transfer_reference === desiredRef) {
      return {
        ok: true,
        draft: { payment: existing, transferReference: desiredRef },
      };
    }

    const admin = createAdminClient();
    const { data: updated, error: updateError } = await admin
      .from("payments")
      .update({ transfer_reference: desiredRef })
      .eq("id", existing.id)
      .select("*")
      .single<PaymentRow>();

    if (updateError || !updated) {
      return { ok: false, error: updateError?.message ?? "reference_failed" };
    }

    return {
      ok: true,
      draft: { payment: updated, transferReference: desiredRef },
    };
  }

  const insertRow: PaymentInsert = {
    child_id: params.childId,
    parent_id: params.parentId,
    amount_cents: params.amountCents,
    currency: "EUR",
    provider: "MANUAL",
    method: "OTHER",
    status: "PENDING",
    purpose: params.purpose,
    reference_id: params.referenceId ?? undefined,
  };

  const { data: inserted, error: insertError } = await supabase
    .from("payments")
    .insert(insertRow)
    .select("*")
    .single<PaymentRow>();

  if (insertError || !inserted) {
    return { ok: false, error: insertError?.message ?? "insert_failed" };
  }

  const transferReference = storedTransferReference({
    purpose: params.purpose,
    childId: params.childId,
    paymentId: inserted.id,
    activityReferenceOverride: activityRefOverride,
  });

  const admin = createAdminClient();
  const { data: updated, error: updateError } = await admin
    .from("payments")
    .update({ transfer_reference: transferReference })
    .eq("id", inserted.id)
    .select("*")
    .single<PaymentRow>();

  if (updateError || !updated) {
    return { ok: false, error: updateError?.message ?? "reference_failed" };
  }

  return {
    ok: true,
    draft: { payment: updated, transferReference },
  };
}
