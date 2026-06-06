import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type StaffPaymentRow = {
  id: string;
  amount_cents: number;
  status: Database["public"]["Enums"]["payment_status"];
  method: Database["public"]["Enums"]["payment_method"] | null;
  paid_at: string | null;
  created_at: string;
  child_first_name: string;
  child_last_name: string;
  parent_name: string;
  parent_email: string;
};

export async function getStaffPayments(): Promise<{
  payments: StaffPaymentRow[];
  loadError: string | null;
}> {
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("payments")
    .select(
      "id, amount_cents, status, method, paid_at, created_at, child_id, parent_id"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    if (error.code === "42P01") {
      return {
        payments: [],
        loadError: "Table payments absente. Lance 010_parent_enrollment.sql.",
      };
    }
    return { payments: [], loadError: error.message };
  }

  const paymentRows = (rows ?? []) as {
    id: string;
    amount_cents: number;
    status: StaffPaymentRow["status"];
    method: StaffPaymentRow["method"];
    paid_at: string | null;
    created_at: string;
    child_id: string;
    parent_id: string;
  }[];

  if (paymentRows.length === 0) {
    return { payments: [], loadError: null };
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

  return {
    payments: paymentRows.map((p) => {
      const child = childMap.get(p.child_id);
      const profile = profileMap.get(p.parent_id);
      return {
        id: p.id,
        amount_cents: p.amount_cents,
        status: p.status,
        method: p.method,
        paid_at: p.paid_at,
        created_at: p.created_at,
        child_first_name: child?.first_name ?? "Enfant",
        child_last_name: child?.last_name ?? "",
        parent_name: profile?.full_name ?? "Parent",
        parent_email: profile?.email ?? "",
      };
    }),
    loadError: null,
  };
}
