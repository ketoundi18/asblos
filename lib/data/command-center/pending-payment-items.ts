import { createClient } from "@/lib/supabase/server";
import type { CommandItem } from "@/lib/data/command-center/types";

export async function getPendingPaymentItems(): Promise<CommandItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("id, amount_cents, created_at, child_id, parent_id")
    .eq("status", "PENDING")
    .order("created_at", { ascending: false })
    .limit(15);

  if (error || !data?.length) return [];

  const rows = data as {
    id: string;
    amount_cents: number;
    child_id: string;
    parent_id: string;
  }[];

  const childIds = [...new Set(rows.map((r) => r.child_id))];
  const parentIds = [...new Set(rows.map((r) => r.parent_id))];

  const [{ data: children }, { data: profiles }] = await Promise.all([
    supabase.from("children").select("id, first_name, last_name").in("id", childIds),
    supabase.from("profiles").select("id, full_name").in("id", parentIds),
  ]);

  const childMap = new Map(
    ((children ?? []) as { id: string; first_name: string; last_name: string }[]).map(
      (c) => [c.id, c]
    )
  );
  const profileMap = new Map(
    ((profiles ?? []) as { id: string; full_name: string }[]).map((p) => [p.id, p])
  );

  return rows.map((r) => {
    const child = childMap.get(r.child_id);
    const parent = profileMap.get(r.parent_id);
    const euros = (r.amount_cents / 100).toFixed(2).replace(".", ",") + " €";
    return {
      id: r.id,
      title: child ? `${child.first_name} ${child.last_name}` : "Paiement",
      subtitle: `${euros} · ${parent?.full_name ?? "Parent"}`,
      href: "/paiements",
      priority: "attention" as const,
      actionLabel: "Paiements",
    };
  });
}
