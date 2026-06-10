import { createClient } from "@/lib/supabase/server";
import { formatEnrollmentFeeLabel } from "@/lib/asbl/fee-utils";
import {
  membershipIsSchoolSupportPendingConfirm,
  membershipFromEnrollmentState,
} from "@/lib/enrollment/child-enrollment-state";
import { getChildEnrollmentState } from "@/lib/enrollment/get-child-enrollment-state";
import {
  membershipToParentDisplay,
  type Membership,
} from "@/lib/data/memberships";
import { formatActivityDate, formatActivityTime } from "@/types/activity";
import { formatSlotSchedule, type SchoolSupportSlot } from "@/types/school-support";
import { formatCentsForDisplay } from "@/lib/config/payments";
import { getLocalTodayISO } from "@/lib/date-utils";

export type ChildOverviewMembership = {
  planLabel: string;
  statusLabel: string;
  variant: "success" | "warning" | "muted";
  feeLabel: string;
  canConfirmSchoolSupport: boolean;
};

export type ChildOverviewSchoolSupport = {
  programId: string;
  programTitle: string;
  slotLabels: string[];
  statusLabel: string;
};

export type ChildOverviewActivity = {
  id: string;
  activityId: string;
  title: string;
  dateLabel: string;
  paymentLabel: string;
  href: string;
};

export type ChildOverviewPayment = {
  id: string;
  amountLabel: string;
  statusLabel: string;
  dateLabel: string;
};

export type ChildOverview = {
  membership: ChildOverviewMembership | null;
  schoolSupport: ChildOverviewSchoolSupport | null;
  activities: ChildOverviewActivity[];
  payments: ChildOverviewPayment[];
};

function membershipOverview(membership: Membership | null): ChildOverviewMembership | null {
  if (!membership) return null;

  const display = membershipToParentDisplay(membership);
  const planLabel =
    membership.plan === "SCHOOL_SUPPORT"
      ? "Accompagnement scolaire"
      : "Inscription simple";

  const canConfirmSchoolSupport = membershipIsSchoolSupportPendingConfirm(membership);

  return {
    planLabel,
    statusLabel: display.label,
    variant: display.variant,
    feeLabel: formatEnrollmentFeeLabel(membership.fee_cents),
    canConfirmSchoolSupport,
  };
}

function paymentStatusLabel(status: string): string {
  if (status === "PAID") return "Payé";
  if (status === "PENDING") return "En attente";
  if (status === "FAILED") return "Échoué";
  return status;
}

function activityPaymentLabel(status: string | null): string {
  if (status === "PAID") return "Payé";
  if (status === "DEFERRED") return "Reporté";
  if (status === "PENDING") return "En attente";
  return "—";
}

export async function getChildOverview(childId: string): Promise<ChildOverview> {
  const supabase = await createClient();
  const today = getLocalTodayISO();

  const { state } = await getChildEnrollmentState(childId);
  const membership = state ? membershipFromEnrollmentState(state) : null;

  const [{ data: enrollRows, error: enrollError }, { data: activityRows }, { data: paymentRows }] =
    await Promise.all([
      supabase
        .from("school_support_enrollments")
        .select(
          `
        id,
        status,
        program_id,
        school_support_programs ( title )
      `
        )
        .eq("child_id", childId)
        .in("status", ["ACTIVE", "PENDING"])
        .is("cancelled_at", null)
        .maybeSingle(),
      supabase
        .from("activity_registrations")
        .select(
          `
        id,
        payment_status,
        activity_id,
        activities ( title, activity_date, start_time, status, deleted_at )
      `
        )
        .eq("child_id", childId)
        .is("cancelled_at", null)
        .order("created_at", { ascending: false })
        .limit(12),
      supabase
        .from("payments")
        .select("id, amount_cents, status, created_at")
        .eq("child_id", childId)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  let schoolSupport: ChildOverviewSchoolSupport | null = null;

  if (enrollRows && !enrollError) {
    type EnrollRow = {
      id: string;
      status: string;
      program_id: string;
      school_support_programs: { title: string } | null;
    };
    const row = enrollRows as EnrollRow;
    const program = row.school_support_programs;

    if (program) {
      const { data: chosenRows } = await supabase
        .from("school_support_enrollment_slots")
        .select(
          "slot_id, school_support_slots ( id, program_id, day_of_week, start_time, end_time, location, label )"
        )
        .eq("enrollment_id", row.id);

      type ChosenRow = {
        school_support_slots: SchoolSupportSlot | null;
      };
      const chosen = ((chosenRows ?? []) as unknown as ChosenRow[])
        .map((r) => r.school_support_slots)
        .filter((s): s is SchoolSupportSlot => s != null);

      let slotLabels: string[];
      if (chosen.length > 0) {
        slotLabels = chosen.map((s) => formatSlotSchedule(s));
      } else {
        const { data: slots } = await supabase
          .from("school_support_slots")
          .select("id, program_id, day_of_week, start_time, end_time, location, label")
          .eq("program_id", row.program_id)
          .order("day_of_week", { ascending: true });
        slotLabels = ((slots ?? []) as SchoolSupportSlot[]).map((s) => formatSlotSchedule(s));
      }

      schoolSupport = {
        programId: row.program_id,
        programTitle: program.title,
        slotLabels,
        statusLabel:
          row.status === "PENDING"
            ? "Inscription en attente de validation ASBL"
            : "Inscrit au programme",
      };
    }
  } else if (
    state?.layer_c == null &&
    membership?.plan === "SCHOOL_SUPPORT" &&
    membership.status !== "ACTIVE"
  ) {
    schoolSupport = {
      programId: "",
      programTitle: "Accompagnement scolaire",
      slotLabels: [],
      statusLabel:
        membership.status === "AWAITING_PAYMENT"
          ? "Cotisation en attente"
          : "En attente de validation ASBL",
    };
  }

  type ActivityRegRow = {
    id: string;
    payment_status: string | null;
    activity_id: string;
    activities: {
      title: string;
      activity_date: string;
      start_time: string | null;
      status: string;
      deleted_at: string | null;
    } | null;
  };

  const activities: ChildOverviewActivity[] = ((activityRows ?? []) as ActivityRegRow[])
    .filter((r) => r.activities && !r.activities.deleted_at)
    .filter((r) => r.activities!.activity_date >= today || r.activities!.status !== "TERMINEE")
    .slice(0, 5)
    .map((r) => {
      const a = r.activities!;
      const time = formatActivityTime(a.start_time);
      return {
        id: r.id,
        activityId: r.activity_id,
        title: a.title,
        dateLabel: `${formatActivityDate(a.activity_date)}${time ? ` · ${time}` : ""}`,
        paymentLabel: activityPaymentLabel(r.payment_status),
        href: `/activites/${r.activity_id}`,
      };
    });

  const payments: ChildOverviewPayment[] = (
    (paymentRows ?? []) as {
      id: string;
      amount_cents: number;
      status: string;
      created_at: string;
    }[]
  ).map((p) => ({
    id: p.id,
    amountLabel: formatCentsForDisplay(p.amount_cents),
    statusLabel: paymentStatusLabel(p.status),
    dateLabel: new Date(p.created_at).toLocaleDateString("fr-BE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
  }));

  return {
    membership: membershipOverview(membership),
    schoolSupport,
    activities,
    payments,
  };
}
