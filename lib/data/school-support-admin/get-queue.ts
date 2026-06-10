import { isStaffFullAccess } from "@/lib/auth/permissions";
import { getCurrentProfile } from "@/lib/auth/session";
import { getCurrentSchoolYear } from "@/lib/school-year";
import { createClient } from "@/lib/supabase/server";
import {
  getAsblSettingsForCurrentYear,
  getSchoolSupportFeeCents,
} from "@/lib/data/asbl-settings";
import { buildSchoolSupportAdminRequest } from "@/lib/data/school-support-admin/build-request";
import { loadSchoolSupportEnrollmentDetails } from "@/lib/data/school-support-admin/enrollment-details";
import type { SchoolSupportAdminRequest } from "@/lib/data/school-support-admin/types";
import type { MembershipPlan, MembershipStatus } from "@/lib/data/memberships";
import { queueMembershipFromState } from "@/lib/enrollment/child-enrollment-state";
import { getChildEnrollmentStates } from "@/lib/enrollment/get-child-enrollment-state";

export async function getSchoolSupportAdminQueue(): Promise<{
  requests: SchoolSupportAdminRequest[];
  loadError: string | null;
}> {
  const profile = await getCurrentProfile();
  if (!profile?.is_active || !isStaffFullAccess(profile.role)) {
    return { requests: [], loadError: "Accès refusé." };
  }

  const supabase = await createClient();
  const schoolYear = getCurrentSchoolYear();

  const { data: rows, error } = await supabase
    .from("memberships")
    .select("id, child_id, parent_id, plan, fee_cents, status")
    .eq("school_year", schoolYear)
    .eq("plan", "SCHOOL_SUPPORT")
    .in("status", ["AWAITING_ASBL", "AWAITING_PAYMENT"]);

  if (error) {
    if (error.message.includes("plan")) {
      return {
        requests: [],
        loadError: "Lance 017_school_support_module.sql dans Supabase.",
      };
    }
    return { requests: [], loadError: error.message };
  }

  const memberships = (rows ?? []) as {
    id: string;
    child_id: string;
    parent_id: string;
    plan: MembershipPlan;
    fee_cents: number;
    status: MembershipStatus;
  }[];

  const seenChildIds = new Set(memberships.map((m) => m.child_id));

  const { data: linkRows } = await supabase
    .from("parent_child_links")
    .select("child_id");

  const extraChildIds = [
    ...new Set(
      ((linkRows ?? []) as { child_id: string }[])
        .map((l) => l.child_id)
        .filter((id) => !seenChildIds.has(id))
    ),
  ];

  if (extraChildIds.length > 0) {
    const { settings } = await getAsblSettingsForCurrentYear();
    const defaultFee = getSchoolSupportFeeCents(settings);
    const { states, loadError: stateError } = await getChildEnrollmentStates(
      extraChildIds,
      schoolYear
    );

    if (stateError) {
      return { requests: [], loadError: stateError };
    }

    for (const childId of extraChildIds) {
      const state = states.get(childId);
      if (!state) continue;
      const row = queueMembershipFromState(state, defaultFee);
      if (!row || seenChildIds.has(row.child_id)) continue;
      memberships.push(row);
      seenChildIds.add(row.child_id);
    }
  }

  if (memberships.length === 0) {
    return { requests: [], loadError: null };
  }

  const childIds = [...new Set(memberships.map((m) => m.child_id))];
  const parentIds = [...new Set(memberships.map((m) => m.parent_id))];

  const [{ data: children }, { data: profiles }, { data: links }] = await Promise.all([
    supabase.from("children").select("id, first_name, last_name").in("id", childIds),
    supabase.from("profiles").select("id, full_name, email").in("id", parentIds),
    supabase
      .from("parent_child_links")
      .select("child_id, verified_at")
      .in("child_id", childIds),
  ]);

  const childMap = new Map(
    ((children ?? []) as { id: string; first_name: string; last_name: string }[]).map(
      (c) => [c.id, c]
    )
  );
  const profileMap = new Map(
    ((profiles ?? []) as { id: string; full_name: string; email: string }[]).map(
      (p) => [p.id, p]
    )
  );
  const verifiedChildren = new Set(
    ((links ?? []) as { child_id: string; verified_at: string | null }[])
      .filter((l) => l.verified_at)
      .map((l) => l.child_id)
  );

  const enrollmentByChild = await loadSchoolSupportEnrollmentDetails(supabase, childIds);

  const requests = memberships.map((m) =>
    buildSchoolSupportAdminRequest(
      m,
      childMap,
      profileMap,
      verifiedChildren,
      enrollmentByChild
    )
  );

  requests.sort((a, b) => {
    if (a.can_confirm && !b.can_confirm) return -1;
    if (!a.can_confirm && b.can_confirm) return 1;
    return a.child_name.localeCompare(b.child_name);
  });

  return { requests, loadError: null };
}
