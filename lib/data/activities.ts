import { createClient } from "@/lib/supabase/server";
import type {
  Activity,
  ActivityWithDetails,
  RegisteredChild,
} from "@/types/activity";
import { normalizeActivity } from "@/types/activity";

export async function getActivitiesList(): Promise<{
  activities: Activity[];
  loadError: string | null;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .is("deleted_at", null)
    .order("activity_date", { ascending: true });

  if (error) {
    if (error.code === "42P01" || error.message.includes("does not exist")) {
      const is012 = error.message.includes("price_cents");
      return {
        activities: [],
        loadError: is012
          ? "Lance 012_activity_parent_options.sql dans Supabase (SQL Editor)."
          : "La base n'est pas prête. Lance le script 005_activities.sql dans Supabase.",
      };
    }
    return {
      activities: [],
      loadError: `Impossible de charger les activités (${error.message}).`,
    };
  }

  return {
    activities: ((data ?? []) as Activity[]).map(normalizeActivity),
    loadError: null,
  };
}

export async function getActivityById(
  id: string
): Promise<ActivityWithDetails | null> {
  const supabase = await createClient();

  const { data: activity, error: activityError } = await supabase
    .from("activities")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (activityError || !activity) return null;

  const base = normalizeActivity(activity as Activity);

  const { data: rows, error: regError } = await supabase
    .from("activity_registrations")
    .select(
      `
      id,
      child_id,
      cancelled_at,
      children (
        first_name,
        last_name,
        allergies
      )
    `
    )
    .eq("activity_id", id)
    .is("cancelled_at", null);

  if (regError) {
    return {
      ...base,
      registrations: [],
      registration_count: 0,
      present_count: 0,
    };
  }

  const { data: attendanceRows, error: attError } = await supabase
    .from("activity_attendance")
    .select("id, child_id, is_present")
    .eq("activity_id", id);

  if (attError) {
    return {
      ...base,
      registrations: [],
      registration_count: 0,
      present_count: 0,
    };
  }

  type AttendanceRow = { id: string; child_id: string; is_present: boolean };
  const attendanceByChild = new Map(
    ((attendanceRows ?? []) as AttendanceRow[]).map((a) => [
      a.child_id,
      { id: a.id, is_present: a.is_present },
    ])
  );

  type RegistrationRow = {
    id: string;
    child_id: string;
    children: {
      first_name: string;
      last_name: string;
      allergies: string | null;
    };
  };

  const registrations: RegisteredChild[] = ((rows ?? []) as RegistrationRow[])
    .filter((r) => r.children)
    .map((r) => {
      const att = attendanceByChild.get(r.child_id);
      return {
        registration_id: r.id,
        child_id: r.child_id,
        first_name: r.children.first_name,
        last_name: r.children.last_name,
        allergies: r.children.allergies,
        is_present: att ? att.is_present : null,
        attendance_id: att?.id ?? null,
      };
    })
    .sort((a, b) => a.last_name.localeCompare(b.last_name, "fr"));

  const present_count = registrations.filter((r) => r.is_present === true).length;

  return {
    ...base,
    registrations,
    registration_count: registrations.length,
    present_count,
  };
}

export async function getActiveChildrenForRegistration(): Promise<
  { id: string; first_name: string; last_name: string }[]
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("children")
    .select("id, first_name, last_name")
    .eq("status", "ACTIF")
    .is("deleted_at", null)
    .order("last_name", { ascending: true });

  return (data ?? []) as { id: string; first_name: string; last_name: string }[];
}
