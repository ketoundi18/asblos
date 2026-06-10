import { createClient } from "@/lib/supabase/server";
import { getLocalTodayISO } from "@/lib/date-utils";
import { getChildEnrollmentStates } from "@/lib/enrollment/get-child-enrollment-state";
import {
  resolveActivityRegistrationEligibilityFromState,
  type ActivityRegistrationEligibility,
} from "@/lib/parent/activity-eligibility";
import type { Activity, ActivityRegistrationPaymentStatus } from "@/types/activity";
import { normalizeActivity, normalizeRegistrationPaymentStatus } from "@/types/activity";

export type ParentChildForRegistration = {
  id: string;
  first_name: string;
  last_name: string;
  eligibility: ActivityRegistrationEligibility;
};

export type ParentActivityListItem = Activity & {
  registration_count: number;
  my_registered_child_ids: string[];
  my_registrations?: ParentChildRegistration[];
};

export type ParentChildRegistration = {
  child_id: string;
  payment_status: ActivityRegistrationPaymentStatus;
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
    .gte("activity_date", getLocalTodayISO())
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
    .select("child_id, payment_status")
    .eq("activity_id", id)
    .is("cancelled_at", null);

  type RegRow = { child_id: string; payment_status?: string | null };
  const regRows = (regs ?? []) as RegRow[];
  const myIds = regRows.map((r) => r.child_id);
  const myRegistrations: ParentChildRegistration[] = regRows.map((r) => ({
    child_id: r.child_id,
    payment_status: normalizeRegistrationPaymentStatus(r.payment_status),
  }));

  return {
    ...activity,
    registration_count: myIds.length,
    my_registered_child_ids: myIds,
    my_registrations: myRegistrations,
  };
}

export async function getParentVerifiedChildrenForRegistration(): Promise<
  ParentChildForRegistration[]
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

  const childRows = (children ?? []) as {
    id: string;
    first_name: string;
    last_name: string;
  }[];

  const { states } = await getChildEnrollmentStates(childIds);

  return childRows.map((child) => ({
    id: child.id,
    first_name: child.first_name,
    last_name: child.last_name,
    eligibility: (() => {
      const state = states.get(child.id);
      if (!state) {
        return {
          allowed: false as const,
          reason: "legacy_pending" as const,
          message:
            "L'ASBL doit encore valider le dossier de votre enfant avant l'inscription aux activités.",
        };
      }
      return resolveActivityRegistrationEligibilityFromState(state);
    })(),
  }));
}
