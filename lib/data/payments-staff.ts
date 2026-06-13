import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type StaffPaymentRow = {
  id: string;
  amount_cents: number;
  status: Database["public"]["Enums"]["payment_status"];
  method: Database["public"]["Enums"]["payment_method"] | null;
  purpose: Database["public"]["Enums"]["payment_purpose"] | null;
  paid_at: string | null;
  created_at: string;
  transfer_reference: string | null;
  proof_storage_path: string | null;
  proof_original_filename: string | null;
  proof_submitted_at: string | null;
  proof_rejection_note: string | null;
  child_first_name: string;
  child_last_name: string;
  parent_name: string;
  parent_email: string;
};

export async function getStaffPayments(): Promise<{
  payments: StaffPaymentRow[];
  proofQueue: StaffPaymentRow[];
  loadError: string | null;
}> {
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("payments")
    .select(
      "id, amount_cents, status, method, purpose, paid_at, created_at, child_id, parent_id, transfer_reference, proof_storage_path, proof_original_filename, proof_submitted_at, proof_rejection_note"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    if (error.code === "42P01") {
      return {
        payments: [],
        proofQueue: [],
        loadError: "Table payments absente. Lance 010_parent_enrollment.sql.",
      };
    }
    if (error.message.includes("proof_storage_path")) {
      return {
        payments: [],
        proofQueue: [],
        loadError: "Migration 048–049 (virement) requise.",
      };
    }
    return { payments: [], proofQueue: [], loadError: error.message };
  }

  const paymentRows = (rows ?? []) as {
    id: string;
    amount_cents: number;
    status: StaffPaymentRow["status"];
    method: StaffPaymentRow["method"];
    purpose: StaffPaymentRow["purpose"];
    paid_at: string | null;
    created_at: string;
    child_id: string;
    parent_id: string;
    transfer_reference: string | null;
    proof_storage_path: string | null;
    proof_original_filename: string | null;
    proof_submitted_at: string | null;
    proof_rejection_note: string | null;
  }[];

  if (paymentRows.length === 0) {
    return { payments: [], proofQueue: [], loadError: null };
  }

  const childIds = [...new Set(paymentRows.map((p) => p.child_id))];
  const parentIds = [...new Set(paymentRows.map((p) => p.parent_id))];

  const [{ data: children }, { data: profiles }] = await Promise.all([
    supabase
      .from("children")
      .select("id, first_name, last_name")
      .in("id", childIds),
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", parentIds),
  ]);

  const childMap = new Map(
    ((children ?? []) as { id: string; first_name: string; last_name: string }[]).map(
      (c) => [c.id, c]
    )
  );
  const profileMap = new Map(
    ((profiles ?? []) as { id: string; full_name: string; email: string }[]).map(
      (p) => [p.id, p]
    )
  );

  const mapRow = (p: (typeof paymentRows)[number]): StaffPaymentRow => {
    const child = childMap.get(p.child_id);
    const profile = profileMap.get(p.parent_id);
    return {
      id: p.id,
      amount_cents: p.amount_cents,
      status: p.status,
      method: p.method,
      purpose: p.purpose,
      paid_at: p.paid_at,
      created_at: p.created_at,
      transfer_reference: p.transfer_reference,
      proof_storage_path: p.proof_storage_path,
      proof_original_filename: p.proof_original_filename,
      proof_submitted_at: p.proof_submitted_at,
      proof_rejection_note: p.proof_rejection_note,
      child_first_name: child?.first_name ?? "Enfant",
      child_last_name: child?.last_name ?? "",
      parent_name: profile?.full_name ?? "Parent",
      parent_email: profile?.email ?? "",
    };
  };

  const payments = paymentRows.map(mapRow);
  const proofQueue = payments.filter((p) => p.status === "PROOF_SUBMITTED");

  return {
    payments,
    proofQueue,
    loadError: null,
  };
}
