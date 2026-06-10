import { formatEnrollmentFeeLabel } from "@/lib/data/asbl-settings";
import type { MembershipPlan, MembershipStatus } from "@/lib/data/memberships";
import type {
  SchoolSupportAdminRequest,
  SchoolSupportEnrollmentDetails,
} from "@/lib/data/school-support-admin/types";

export function buildSchoolSupportAdminRequest(
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
  enrollmentByChild: Map<string, SchoolSupportEnrollmentDetails>
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
    program_enrollment_status: enrollment?.program_enrollment_status ?? null,
  };
}
