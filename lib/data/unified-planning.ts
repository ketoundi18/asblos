import { createClient } from "@/lib/supabase/server";
import { addDaysToIso, getLocalTodayISO } from "@/lib/date-utils";
import { formatActivityDate, formatActivityTime } from "@/types/activity";
import { formatSlotSchedule, type SchoolSupportSlot } from "@/types/school-support";

export type PlanningItem =
  | {
      kind: "activity";
      id: string;
      title: string;
      subtitle: string;
      href: string;
      actionLabel: string;
    }
  | {
      kind: "school_support";
      id: string;
      title: string;
      subtitle: string;
      href: string;
      actionLabel: string;
    };

export type PlanningDay = {
  date: string;
  dayLabel: string;
  isToday: boolean;
  items: PlanningItem[];
};

const DAY_NAMES = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

function getWeekdayFromIso(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  const jsDay = new Date(y, m - 1, d).getDay();
  return jsDay === 0 ? 7 : jsDay;
}

function formatDayHeader(isoDate: string, isToday: boolean): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const weekday = DAY_NAMES[new Date(y, m - 1, d).getDay()];
  const label = formatActivityDate(isoDate);
  return isToday ? `Aujourd'hui — ${weekday} ${label}` : `${weekday} ${label}`;
}

export async function getUnifiedPlanning(days = 7): Promise<{
  days: PlanningDay[];
  loadError: string | null;
}> {
  const supabase = await createClient();
  const today = getLocalTodayISO();
  const endDate = addDaysToIso(today, days - 1);

  const [{ data: activities, error: actError }, { data: programs, error: progError }] =
    await Promise.all([
      supabase
        .from("activities")
        .select("id, title, activity_date, start_time, end_time, location")
        .gte("activity_date", today)
        .lte("activity_date", endDate)
        .in("status", ["PLANIFIEE", "EN_COURS"])
        .is("deleted_at", null)
        .order("activity_date", { ascending: true })
        .order("start_time", { ascending: true, nullsFirst: false }),
      supabase
        .from("school_support_programs")
        .select("id, title")
        .eq("status", "OPEN")
        .is("deleted_at", null),
    ]);

  if (actError?.message && !actError.message.includes("does not exist")) {
    return { days: [], loadError: actError.message };
  }

  const programRows = (programs ?? []) as { id: string; title: string }[];
  const programIds = programRows.map((p) => p.id);
  const programTitleMap = new Map(programRows.map((p) => [p.id, p.title]));

  let slotRows: SchoolSupportSlot[] = [];
  const enrollCounts = new Map<string, number>();

  if (programIds.length > 0 && !progError) {
    const [{ data: slots }, { data: enrolls }] = await Promise.all([
      supabase
        .from("school_support_slots")
        .select("id, program_id, day_of_week, start_time, end_time, location, label")
        .in("program_id", programIds),
      supabase
        .from("school_support_enrollments")
        .select("program_id")
        .in("program_id", programIds)
        .eq("status", "ACTIVE")
        .is("cancelled_at", null),
    ]);

    slotRows = (slots ?? []) as SchoolSupportSlot[];
    for (const e of (enrolls ?? []) as { program_id: string }[]) {
      enrollCounts.set(e.program_id, (enrollCounts.get(e.program_id) ?? 0) + 1);
    }
  }

  const activityItemsByDate = new Map<string, PlanningItem[]>();
  for (const a of (activities ?? []) as {
    id: string;
    title: string;
    activity_date: string;
    start_time: string | null;
    end_time: string | null;
    location: string | null;
  }[]) {
    const start = formatActivityTime(a.start_time);
    const end = formatActivityTime(a.end_time);
    const time = start && end ? `${start} – ${end}` : start || "Horaire à confirmer";
    const place = a.location ? ` · ${a.location}` : "";
    const list = activityItemsByDate.get(a.activity_date) ?? [];
    list.push({
      kind: "activity",
      id: a.id,
      title: a.title,
      subtitle: `${time}${place}`,
      href: `/activites/${a.id}/terrain`,
      actionLabel: "Présences",
    });
    activityItemsByDate.set(a.activity_date, list);
  }

  const result: PlanningDay[] = [];

  for (let i = 0; i < days; i++) {
    const date = addDaysToIso(today, i);
    const weekday = getWeekdayFromIso(date);
    const items: PlanningItem[] = [...(activityItemsByDate.get(date) ?? [])];

    for (const slot of slotRows) {
      if (slot.day_of_week !== weekday) continue;
      const programTitle = programTitleMap.get(slot.program_id) ?? "Soutien scolaire";
      const count = enrollCounts.get(slot.program_id) ?? 0;
      items.push({
        kind: "school_support",
        id: `${slot.id}-${date}`,
        title: programTitle,
        subtitle: `${formatSlotSchedule(slot)} · ${count} inscrit${count !== 1 ? "s" : ""}`,
        href: `/soutien-scolaire/${slot.program_id}`,
        actionLabel: "Voir",
      });
    }

    result.push({
      date,
      dayLabel: formatDayHeader(date, date === today),
      isToday: date === today,
      items,
    });
  }

  return { days: result, loadError: null };
}
