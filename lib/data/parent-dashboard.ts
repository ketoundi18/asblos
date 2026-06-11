import { getParentDashboard } from "@/lib/data/parent";
import { getChildEnrollmentStates } from "@/lib/enrollment/get-child-enrollment-state";
import {
  buildChildDashboardFallbackView,
  buildChildDashboardView,
  type ChildDashboardView,
} from "@/lib/parent/child-dashboard-view";
import { createClient } from "@/lib/supabase/server";

async function getActivityCountByChild(
  childIds: string[]
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (childIds.length === 0) return map;

  const supabase = await createClient();
  const { data } = await supabase
    .from("activity_registrations")
    .select("child_id")
    .in("child_id", childIds)
    .is("cancelled_at", null);

  for (const row of (data ?? []) as { child_id: string }[]) {
    map.set(row.child_id, (map.get(row.child_id) ?? 0) + 1);
  }
  return map;
}

export async function getParentChildDashboards(): Promise<{
  children: ChildDashboardView[];
  loadError: string | null;
}> {
  const { links, loadError } = await getParentDashboard();
  if (loadError && links.length === 0) {
    return { children: [], loadError };
  }

  const childIds = links.map((l) => l.child_id);
  const [{ states, loadError: stateError }, activityCounts] = await Promise.all([
    getChildEnrollmentStates(childIds),
    getActivityCountByChild(childIds),
  ]);

  if (stateError?.includes("040_get_child_enrollment_state")) {
    return { children: [], loadError: stateError };
  }

  const children = links.flatMap((link) => {
    const state = states.get(link.child_id);
    const activityCount = activityCounts.get(link.child_id) ?? 0;
    if (!state) {
      return [buildChildDashboardFallbackView({ link, activityCount })];
    }
    return [buildChildDashboardView({ link, state, activityCount })];
  });

  return { children, loadError };
}
