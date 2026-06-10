import type {
  ChildEnrollmentStatus,
  MembershipStatus,
} from "@/lib/constants/status";
import type {
  DerivedEnrollmentFlags,
  EnrollmentLayersSnapshot,
} from "@/lib/enrollment/child-enrollment-state/types";

function inferEffectiveStatus(
  enrollmentStatus: ChildEnrollmentStatus | null,
  membershipStatus: MembershipStatus | null
): MembershipStatus {
  if (membershipStatus) return membershipStatus;
  switch (enrollmentStatus) {
    case "EN_ATTENTE_PAIEMENT":
      return "AWAITING_PAYMENT";
    case "PAYE_EN_ATTENTE_ASBL":
      return "AWAITING_ASBL";
    case "VALIDE":
      return "ACTIVE";
    case "REFUSE":
      return "REJECTED";
    default:
      return "AWAITING_ASBL";
  }
}

/** Miroir SQL membership_status_to_layer_a (RPC 044). */
export function mapMembershipStatusToEnrollmentStatus(
  status: MembershipStatus
): ChildEnrollmentStatus | null {
  switch (status) {
    case "AWAITING_PAYMENT":
      return "EN_ATTENTE_PAIEMENT";
    case "AWAITING_ASBL":
      return "PAYE_EN_ATTENTE_ASBL";
    case "ACTIVE":
      return "VALIDE";
    case "REJECTED":
    case "CANCELLED":
      return "REFUSE";
    default:
      return null;
  }
}

/** Miroir SQL layer_a_to_membership_status (RPC 045). */
export function mapEnrollmentStatusToMembershipStatus(
  status: ChildEnrollmentStatus
): MembershipStatus | null {
  switch (status) {
    case "EN_ATTENTE_PAIEMENT":
      return "AWAITING_PAYMENT";
    case "PAYE_EN_ATTENTE_ASBL":
      return "AWAITING_ASBL";
    case "VALIDE":
      return "ACTIVE";
    case "REFUSE":
      return "REJECTED";
    default:
      return null;
  }
}

/** Recalcule les flags dérivés sans appeler la RPC (listes admin, tests). */
export function deriveEnrollmentFlagsFromLayers(
  snapshot: EnrollmentLayersSnapshot
): DerivedEnrollmentFlags {
  const {
    enrollment_status,
    created_via,
    has_membership,
    membership_plan,
    membership_status,
    membership_fee_cents,
  } = snapshot;

  const effective_membership_status = inferEffectiveStatus(
    enrollment_status,
    membership_status
  );

  const needs_payment = has_membership
    ? membership_status === "AWAITING_PAYMENT" && membership_fee_cents > 0
    : enrollment_status === "EN_ATTENTE_PAIEMENT";

  const blocks_admin_validation =
    needs_payment ||
    (!has_membership &&
      created_via === "PARENT" &&
      enrollment_status === "EN_ATTENTE_PAIEMENT");

  const is_legacy_pending_asbl =
    !has_membership && enrollment_status === "PAYE_EN_ATTENTE_ASBL";

  const is_school_support_pending_confirm =
    (has_membership &&
      membership_plan === "SCHOOL_SUPPORT" &&
      (membership_status === "AWAITING_ASBL" ||
        (membership_status === "AWAITING_PAYMENT" && membership_fee_cents <= 0))) ||
    is_legacy_pending_asbl;

  const is_asbl_validated =
    (has_membership && membership_status === "ACTIVE") ||
    (!has_membership && enrollment_status === "VALIDE");

  const is_rejected =
    (has_membership &&
      (membership_status === "REJECTED" || membership_status === "CANCELLED")) ||
    enrollment_status === "REFUSE";

  return {
    needs_payment,
    blocks_admin_validation,
    is_asbl_validated,
    is_rejected,
    is_school_support_pending_confirm,
    is_legacy_pending_asbl,
    effective_plan: membership_plan,
    effective_membership_status,
  };
}
