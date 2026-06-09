import { createClient } from "@/lib/supabase/server";
import { formatActivityTime } from "@/types/activity";
import type { CommandItem, CommandPriority, CommandSection } from "@/lib/data/command-center/types";

type ActivityRow = {
  id: string;
  title: string;
  activity_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
};

export async function getActivitiesForDate(date: string): Promise<ActivityRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("activities")
    .select("id, title, activity_date, start_time, end_time, location")
    .eq("activity_date", date)
    .in("status", ["PLANIFIEE", "EN_COURS"])
    .is("deleted_at", null)
    .order("start_time", { ascending: true, nullsFirst: false });

  return (data ?? []) as ActivityRow[];
}

function activitySubtitle(a: ActivityRow, registrationCount: number): string {
  const start = formatActivityTime(a.start_time);
  const end = formatActivityTime(a.end_time);
  const time = start && end ? `${start} – ${end}` : start || "Horaire à confirmer";
  const place = a.location ? ` · ${a.location}` : "";
  return `${time} · ${registrationCount} inscrit${registrationCount !== 1 ? "s" : ""}${place}`;
}

export async function buildActivitySection(
  id: string,
  title: string,
  description: string,
  activities: ActivityRow[],
  priority: CommandPriority,
  useTerrainLink: boolean
): Promise<CommandSection> {
  if (activities.length === 0) {
    return { id, title, description, items: [], priority };
  }

  const supabase = await createClient();
  const ids = activities.map((a) => a.id);
  const { data: regs } = await supabase
    .from("activity_registrations")
    .select("activity_id")
    .in("activity_id", ids)
    .is("cancelled_at", null);

  const countByActivity = new Map<string, number>();
  for (const r of (regs ?? []) as { activity_id: string }[]) {
    countByActivity.set(r.activity_id, (countByActivity.get(r.activity_id) ?? 0) + 1);
  }

  const items: CommandItem[] = activities.map((a) => ({
    id: a.id,
    title: a.title,
    subtitle: activitySubtitle(a, countByActivity.get(a.id) ?? 0),
    href: useTerrainLink ? `/activites/${a.id}/terrain` : `/activites/${a.id}`,
    priority,
    actionLabel: useTerrainLink ? "Marquer les présences" : "Voir",
  }));

  return { id, title, description, items, priority };
}
