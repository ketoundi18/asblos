import { createClient } from "@/lib/supabase/server";
import type { Activity } from "@/types/activity";
import { normalizeActivity } from "@/types/activity";

export type ParentActivityListItem = Activity & {
  registration_count: number;
  my_registered_child_ids: string[];
};

export async function getParentActivities(): Promise<{
  activities: ParentActivityListItem[];
  loadError: string | null;
}> {
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("activities")
    .select("id, title, description, activity_date, start_time, end_time, location, max_participants, status, price_cents, parent_registration_open")
    .eq("parent_registration_open", true)
    .in("status", ["PLANIFIEE", "EN_COURS"])
    .is("deleted_at", null)
    .gte("activity_date", new Date().toISOString().slice(0, 10))
    .order("activity_date", { ascending: true });

  if (error) {
    if (error.message.includes("price_cents") || error.message.includes("parent_registration")) {
      return {
        activities: [],
        loadError: "Lance 012_activity_parent_options.sql dans Supabase.",
      };
    }
    if (error.code === "42P01") {
      return {
        activities: [],
        loadError: "Module activités pas prêt. Lance 005_activities.sql dans Supabase.",
      };
    }
    return {
      activities: [],
      loadError: `Impossible de charger les activités (${error.message}).`,
    };
  }

  const activities = (rows ?? []) as Activity[];
  if (activities.length === 0) {
    return { activities: [], loadError: null };
  }

  const ids = activities.map((a) => a.id);

  const { data: allRegs } = await supabase
    .from("activity_registrations")
    .select("activity_id, child_id")
    .in("activity_id", ids)
    .is("cancelled_at", null);

  type RegRow = { activity_id: string; child_id: string };
  const regRows = (allRegs ?? []) as RegRow[];

  const countByActivity = new Map<string, number>();
  const myByActivity = new Map<string, string[]>();

  for (const r of regRows) {
    countByActivity.set(r.activity_id, (countByActivity.get(r.activity_id) ?? 0) + 1);
    const list = myByActivity.get(r.activity_id) ?? [];
    list.push(r.child_id);
    myByActivity.set(r.activity_id, list);
  }

  return {
    activities: activities.map((a) => ({
      ...normalizeActivity(a),
      registration_count: countByActivity.get(a.id) ?? 0,
      my_registered_child_ids: myByActivity.get(a.id) ?? [],
    })),
    loadError: null,
  };
}

export async function getParentActivityById(
  id: string
): Promise<ParentActivityListItem | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("activities")
    .select("id, title, description, activity_date, start_time, end_time, location, max_participants, status, price_cents, parent_registration_open")
    .eq("id", id)
    .eq("parent_registration_open", true)
    .is("deleted_at", null)
    .single();

  if (error || !data) return null;

  const activity = normalizeActivity(data as Activity);

  const { data: regs } = await supabase
    .from("activity_registrations")
    .select("child_id")
    .eq("activity_id", id)
    .is("cancelled_at", null);

  const myIds = ((regs ?? []) as { child_id: string }[]).map((r) => r.child_id);

  return {
    ...activity,
    registration_count: myIds.length,
    my_registered_child_ids: myIds,
  };
}

export async function getParentVerifiedChildrenForRegistration(): Promise<
  { id: string; first_name: string; last_name: string }[]
> {
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("parent_child_links")
    .select("child_id")
    .not("verified_at", "is", null);

  const links = (rows ?? []) as { child_id: string }[];

  if (links.length === 0) return [];

  const childIds = links.map((l) => l.child_id);

  const { data: children } = await supabase
    .from("children")
    .select("id, first_name, last_name")
    .in("id", childIds)
    .is("deleted_at", null);

  return (children ?? []) as { id: string; first_name: string; last_name: string }[];
}
