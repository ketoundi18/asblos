import { createClient } from "@/lib/supabase/server";
import { getParentDashboard } from "@/lib/data/parent";
import { getMembershipsForParentDashboard } from "@/lib/data/memberships";
import {
  buildChildSerenityView,
  type ChildSerenityView,
} from "@/lib/parent/serenity";

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

async function getSchoolSupportEnrollmentByChild(
  childIds: string[]
): Promise<Set<string>> {
  const set = new Set<string>();
  if (childIds.length === 0) return set;

  const supabase = await createClient();
  const { data } = await supabase
    .from("school_support_enrollments")
    .select("child_id")
    .in("child_id", childIds)
    .is("cancelled_at", null);

  for (const row of (data ?? []) as { child_id: string }[]) {
    set.add(row.child_id);
  }
  return set;
}

export async function getParentSerenityDashboard(): Promise<{
  children: ChildSerenityView[];
  loadError: string | null;
}> {
  const { links, loadError } = await getParentDashboard();
  if (loadError && links.length === 0) {
    return { children: [], loadError };
  }

  const membershipMap = await getMembershipsForParentDashboard();
  const childIds = links.map((l) => l.child_id);
  const [activityCounts, schoolSupportEnrolled] = await Promise.all([
    getActivityCountByChild(childIds),
    getSchoolSupportEnrollmentByChild(childIds),
  ]);

  const children = links.map((link) =>
    buildChildSerenityView({
      link,
      membership: membershipMap.get(link.child_id) ?? null,
      activityCount: activityCounts.get(link.child_id) ?? 0,
      hasSchoolSupportEnrollment: schoolSupportEnrolled.has(link.child_id),
    })
  );

  return { children, loadError };
}
