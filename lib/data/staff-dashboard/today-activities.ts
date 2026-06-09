import { createClient } from "@/lib/supabase/server";
import { getLocalTodayISO } from "@/lib/date-utils";
import { formatActivityTime } from "@/types/activity";
import type { StaffTodayActivity } from "@/lib/data/staff-dashboard/types";

export async function getTodayActivities(): Promise<StaffTodayActivity[]> {
  const supabase = await createClient();
  const today = getLocalTodayISO();

  const { data: rows, error } = await supabase
    .from("activities")
    .select("id, title, start_time, end_time")
    .eq("activity_date", today)
    .in("status", ["PLANIFIEE", "EN_COURS"])
    .is("deleted_at", null)
    .order("start_time", { ascending: true, nullsFirst: false });

  if (error || !rows?.length) return [];

  const activities = rows as {
    id: string;
    title: string;
    start_time: string | null;
    end_time: string | null;
  }[];

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

  return activities.map((a) => {
    const start = formatActivityTime(a.start_time);
    const end = formatActivityTime(a.end_time);
    const timeLabel = start && end ? `${start} – ${end}` : start || "Horaire à confirmer";
    return {
      id: a.id,
      title: a.title,
      timeLabel,
      registrationCount: countByActivity.get(a.id) ?? 0,
    };
  });
}
