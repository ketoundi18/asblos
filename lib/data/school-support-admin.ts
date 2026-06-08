import { createStaffReadClient } from "@/lib/supabase/staff-read";
import { getCurrentSchoolYear } from "@/lib/school-year";
import { formatEnrollmentFeeLabel, getAsblSettingsForCurrentYear, getSchoolSupportFeeCents } from "@/lib/data/asbl-settings";
import type { MembershipPlan, MembershipStatus } from "@/lib/data/memberships";
import { formatSlotSchedule, type SchoolSupportSlot } from "@/types/school-support";

export type SchoolSupportAdminRequest = {
  membership_id: string;
  child_id: string;
  child_name: string;
  parent_id: string;
  parent_name: string;
  parent_email: string;
  plan: MembershipPlan;
  status: MembershipStatus;
  fee_cents: number;
  fee_label: string;
  link_verified: boolean;
  can_confirm: boolean;
  status_label: string;
  program_title: string | null;
  slot_labels: string[];
  enrollment_status: string | null;
};

function buildRequest(
  m: {
    id: string;
    child_id: string;
    parent_id: string;
    plan: MembershipPlan;
    fee_cents: number;
    status: MembershipStatus;
  },
  childMap: Map<string, { first_name: string; last_name: string }>,
  profileMap: Map<string, { full_name: string; email: string }>,
  verifiedChildren: Set<string>,
  enrollmentByChild: Map<
    string,
    { program_title: string | null; slot_labels: string[]; enrollment_status: string | null }
  >
): SchoolSupportAdminRequest {
  const child = childMap.get(m.child_id);
  const parent = profileMap.get(m.parent_id);
  const paymentPending = m.status === "AWAITING_PAYMENT" && m.fee_cents > 0;
  const enrollment = enrollmentByChild.get(m.child_id);

  return {
    membership_id: m.id,
    child_id: m.child_id,
    child_name: child ? `${child.first_name} ${child.last_name}` : "Enfant",
    parent_id: m.parent_id,
    parent_name: parent?.full_name ?? "Parent",
    parent_email: parent?.email ?? "—",
    plan: m.plan,
    status: m.status,
    fee_cents: m.fee_cents,
    fee_label: formatEnrollmentFeeLabel(m.fee_cents),
    link_verified: verifiedChildren.has(m.child_id),
    can_confirm:
      m.status === "AWAITING_ASBL" ||
      (m.status === "AWAITING_PAYMENT" && m.fee_cents <= 0),
    status_label: paymentPending
      ? "Paiement cotisation en attente"
      : "Soutien scolaire à confirmer",
    program_title: enrollment?.program_title ?? null,
    slot_labels: enrollment?.slot_labels ?? [],
    enrollment_status: enrollment?.enrollment_status ?? null,
  };
}

export async function getSchoolSupportAdminQueue(): Promise<{
  requests: SchoolSupportAdminRequest[];
  loadError: string | null;
}> {
  const supabase = await createStaffReadClient();
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

  // Secours : enfants marqués « soutien en attente » même si l'adhésion n'a pas été mise à jour
  const { data: pendingChildren } = await supabase
    .from("children")
    .select("id, first_name, last_name, enrollment_status")
    .in("enrollment_status", ["PAYE_EN_ATTENTE_ASBL", "EN_ATTENTE_PAIEMENT"])
    .is("deleted_at", null);

  const extraChildIds = ((pendingChildren ?? []) as { id: string }[])
    .map((c) => c.id)
    .filter((id) => !seenChildIds.has(id));

  if (extraChildIds.length > 0) {
    const { settings } = await getAsblSettingsForCurrentYear();
    const defaultFee = getSchoolSupportFeeCents(settings);

    const { data: extraMemberships } = await supabase
      .from("memberships")
      .select("id, child_id, parent_id, plan, fee_cents, status")
      .eq("school_year", schoolYear)
      .in("child_id", extraChildIds);

    for (const row of (extraMemberships ?? []) as typeof memberships) {
      const child = (pendingChildren ?? []).find(
        (c) => (c as { id: string }).id === row.child_id
      ) as { enrollment_status: string } | undefined;

      if (child?.enrollment_status === "PAYE_EN_ATTENTE_ASBL") {
        memberships.push({
          ...row,
          plan: "SCHOOL_SUPPORT",
          status: "AWAITING_ASBL",
          fee_cents: row.fee_cents || defaultFee,
        });
      } else if (child?.enrollment_status === "EN_ATTENTE_PAIEMENT") {
        memberships.push({
          ...row,
          plan: "SCHOOL_SUPPORT",
          status: "AWAITING_PAYMENT",
          fee_cents: row.fee_cents || defaultFee,
        });
      }
      seenChildIds.add(row.child_id);
    }

    // Enfant sans ligne membership du tout
    const { data: links } = await supabase
      .from("parent_child_links")
      .select("child_id, parent_id")
      .in("child_id", extraChildIds)
      .not("verified_at", "is", null);

    for (const link of (links ?? []) as { child_id: string; parent_id: string }[]) {
      if (seenChildIds.has(link.child_id)) continue;
      const child = (pendingChildren ?? []).find(
        (c) => (c as { id: string }).id === link.child_id
      ) as { id: string; enrollment_status: string } | undefined;
      if (!child) continue;

      memberships.push({
        id: `pending-${link.child_id}`,
        child_id: link.child_id,
        parent_id: link.parent_id,
        plan: "SCHOOL_SUPPORT",
        fee_cents: defaultFee,
        status:
          child.enrollment_status === "EN_ATTENTE_PAIEMENT"
            ? "AWAITING_PAYMENT"
            : "AWAITING_ASBL",
      });
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

  const enrollmentByChild = await loadEnrollmentDetails(supabase, childIds);

  const requests = memberships.map((m) =>
    buildRequest(m, childMap, profileMap, verifiedChildren, enrollmentByChild)
  );

  requests.sort((a, b) => {
    if (a.can_confirm && !b.can_confirm) return -1;
    if (!a.can_confirm && b.can_confirm) return 1;
    return a.child_name.localeCompare(b.child_name);
  });

  return { requests, loadError: null };
}

async function loadEnrollmentDetails(
  supabase: Awaited<ReturnType<typeof createStaffReadClient>>,
  childIds: string[]
): Promise<
  Map<
    string,
    { program_title: string | null; slot_labels: string[]; enrollment_status: string | null }
  >
> {
  const map = new Map<
    string,
    { program_title: string | null; slot_labels: string[]; enrollment_status: string | null }
  >();

  if (childIds.length === 0) return map;

  const { data: enrollRows } = await supabase
    .from("school_support_enrollments")
    .select(
      `
      id,
      child_id,
      status,
      school_support_programs ( title )
    `
    )
    .in("child_id", childIds)
    .in("status", ["PENDING", "ACTIVE"])
    .is("cancelled_at", null);

  type EnrollRow = {
    id: string;
    child_id: string;
    status: string;
    school_support_programs: { title: string } | null;
  };

  const enrollments = (enrollRows ?? []) as EnrollRow[];
  if (enrollments.length === 0) return map;

  const enrollmentIds = enrollments.map((e) => e.id);

  const { data: slotLinkRows } = await supabase
    .from("school_support_enrollment_slots")
    .select("enrollment_id, slot_id")
    .in("enrollment_id", enrollmentIds);

  const slotIds = [
    ...new Set(((slotLinkRows ?? []) as { slot_id: string }[]).map((r) => r.slot_id)),
  ];

  let slotMap = new Map<string, SchoolSupportSlot>();
  if (slotIds.length > 0) {
    const { data: slotRows } = await supabase
      .from("school_support_slots")
      .select("id, program_id, day_of_week, start_time, end_time, location, label")
      .in("id", slotIds);

    slotMap = new Map(
      ((slotRows ?? []) as SchoolSupportSlot[]).map((s) => [s.id, s])
    );
  }

  const linksByEnrollment = new Map<string, string[]>();
  for (const link of (slotLinkRows ?? []) as { enrollment_id: string; slot_id: string }[]) {
    const current = linksByEnrollment.get(link.enrollment_id) ?? [];
    current.push(link.slot_id);
    linksByEnrollment.set(link.enrollment_id, current);
  }

  for (const enroll of enrollments) {
    const chosenIds = linksByEnrollment.get(enroll.id) ?? [];
    const slot_labels = chosenIds
      .map((id) => slotMap.get(id))
      .filter(Boolean)
      .map((slot) => formatSlotSchedule(slot!));

    map.set(enroll.child_id, {
      program_title: enroll.school_support_programs?.title ?? null,
      slot_labels,
      enrollment_status: enroll.status,
    });
  }

  return map;
}
