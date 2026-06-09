import { createClient } from "@/lib/supabase/server";
import { formatActivityDate } from "@/types/activity";
import type { CommandItem } from "@/lib/data/command-center/types";

export async function getDeferredParticipationItems(): Promise<CommandItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_registrations")
    .select(
      `
      id,
      payment_status,
      activity_id,
      activities ( title, activity_date ),
      children ( first_name, last_name )
    `
    )
    .in("payment_status", ["DEFERRED", "PENDING"])
    .is("cancelled_at", null)
    .limit(20);

  if (error?.message?.includes("payment_status") || error || !data?.length) {
    return [];
  }

  type Row = {
    id: string;
    payment_status: string;
    activity_id: string;
    activities: { title: string; activity_date: string } | null;
    children: { first_name: string; last_name: string } | null;
  };

  return ((data ?? []) as Row[])
    .filter((r) => r.activities && r.children)
    .map((r) => ({
      id: r.id,
      title: `${r.children!.first_name} ${r.children!.last_name}`,
      subtitle: `${r.activities!.title} · ${formatActivityDate(r.activities!.activity_date)} · ${
        r.payment_status === "DEFERRED" ? "Report demandé" : "Paiement en attente"
      }`,
      href: `/activites/${r.activity_id}`,
      priority: "attention" as const,
      actionLabel: "Voir activité",
    }));
}
