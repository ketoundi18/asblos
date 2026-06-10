import type {
  ChildEnrollmentStatus,
  MembershipPlan,
  MembershipStatus,
} from "@/lib/constants/status";
import type { Membership } from "@/lib/data/memberships";
import { deriveEnrollmentFlagsFromLayers } from "@/lib/enrollment/child-enrollment-state/derived-flags";
import type { ChildEnrollmentState } from "@/lib/enrollment/child-enrollment-state/types";

export function membershipFromEnrollmentState(
  state: ChildEnrollmentState
): Membership | null {
  if (!state.layer_b) return null;
  return {
    id: state.layer_b.membership_id,
    child_id: state.child_id,
    parent_id: state.layer_b.parent_id,
    school_year: state.school_year,
    plan: state.layer_b.plan,
    fee_cents: state.layer_b.fee_cents,
    status: state.layer_b.status,
    asbl_validated_at: state.layer_b.asbl_validated_at,
  };
}

export function enrollmentStateNeedsPayment(state: ChildEnrollmentState): boolean {
  return state.derived.needs_payment;
}

export function enrollmentStateBlocksAdminValidation(
  state: ChildEnrollmentState
): boolean {
  return state.derived.blocks_admin_validation;
}

export function enrollmentStateIsSchoolSupportPendingConfirm(
  state: ChildEnrollmentState
): boolean {
  return state.derived.is_school_support_pending_confirm;
}

/** Validation ASBL affichée dashboard parent (compat lien vérifié sans membership). */
export function resolveSerenityAsblValidated(
  state: ChildEnrollmentState,
  linkVerified: boolean
): boolean {
  if (state.derived.is_asbl_validated) return true;
  if (!state.derived.has_membership && linkVerified) {
    const status = state.layer_a.enrollment_status;
    return status === "VALIDE" || status === null;
  }
  if (
    state.derived.has_membership &&
    state.layer_b?.status !== "ACTIVE" &&
    state.layer_b?.status !== "AWAITING_ASBL" &&
    linkVerified
  ) {
    return state.layer_a.enrollment_status === "VALIDE";
  }
  return false;
}

export function queueMembershipFromState(
  state: ChildEnrollmentState,
  defaultFeeCents: number
): {
  id: string;
  child_id: string;
  parent_id: string;
  plan: MembershipPlan;
  fee_cents: number;
  status: MembershipStatus;
} | null {
  const pendingStatuses: MembershipStatus[] = ["AWAITING_ASBL", "AWAITING_PAYMENT"];

  if (state.layer_b?.plan === "SCHOOL_SUPPORT" && pendingStatuses.includes(state.layer_b.status)) {
    return {
      id: state.layer_b.membership_id,
      child_id: state.child_id,
      parent_id: state.layer_b.parent_id,
      plan: state.layer_b.plan,
      fee_cents: state.layer_b.fee_cents,
      status: state.layer_b.status,
    };
  }

  if (!state.derived.is_legacy_pending_asbl && !state.derived.needs_payment) {
    return null;
  }

  const parentId = state.link.parent_id;
  if (!parentId) return null;

  return {
    id: `pending-${state.child_id}`,
    child_id: state.child_id,
    parent_id: parentId,
    plan: "SCHOOL_SUPPORT",
    fee_cents: defaultFeeCents,
    status: state.derived.needs_payment ? "AWAITING_PAYMENT" : "AWAITING_ASBL",
  };
}

export function staffParentChildEnrollmentBadgeFromState(
  state: ChildEnrollmentState
): { text: string; variant: "warning" | "success" } | null {
  if (state.layer_a.created_via !== "PARENT") return null;

  if (state.derived.needs_payment) {
    return { text: "Parent · paiement", variant: "warning" };
  }
  if (
    state.derived.is_legacy_pending_asbl ||
    !state.derived.is_asbl_validated
  ) {
    return { text: "Parent · attente ASBL", variant: "warning" };
  }
  return { text: "Parent", variant: "success" };
}

export function staffParentChildEnrollmentBadge(child: {
  created_via?: string | null;
  enrollment_status?: ChildEnrollmentStatus | null;
  asbl_validated_at?: string | null;
}): { text: string; variant: "warning" | "success" } | null {
  if (child.created_via !== "PARENT") return null;

  const flags = deriveEnrollmentFlagsFromLayers({
    enrollment_status: child.enrollment_status ?? null,
    created_via: child.created_via ?? null,
    has_membership: false,
    membership_plan: null,
    membership_status: null,
    membership_fee_cents: 0,
  });

  if (flags.needs_payment) {
    return { text: "Parent · paiement", variant: "warning" };
  }
  if (
    child.enrollment_status === "PAYE_EN_ATTENTE_ASBL" ||
    !child.asbl_validated_at
  ) {
    return { text: "Parent · attente ASBL", variant: "warning" };
  }
  return { text: "Parent", variant: "success" };
}

export function membershipIsSchoolSupportPendingConfirm(membership: Membership): boolean {
  return deriveEnrollmentFlagsFromLayers({
    enrollment_status: null,
    created_via: null,
    has_membership: true,
    membership_plan: membership.plan,
    membership_status: membership.status,
    membership_fee_cents: membership.fee_cents,
  }).is_school_support_pending_confirm;
}

export function adminLinkReadyToValidate(input: {
  verified: boolean;
  membership_status: string | null;
  membership_fee_cents: number | null;
  child_enrollment_status: string | null;
  child_created_via: string | null;
}): boolean {
  if (input.verified) return false;
  const flags = deriveEnrollmentFlagsFromLayers({
    enrollment_status: input.child_enrollment_status as ChildEnrollmentStatus | null,
    created_via: input.child_created_via,
    has_membership: input.membership_status != null,
    membership_plan: null,
    membership_status: input.membership_status as MembershipStatus | null,
    membership_fee_cents: input.membership_fee_cents ?? 0,
  });
  return !flags.blocks_admin_validation;
}

export function adminLinkWaitingPayment(input: {
  verified: boolean;
  membership_status: string | null;
  membership_fee_cents: number | null;
  child_enrollment_status: string | null;
  child_created_via: string | null;
}): boolean {
  if (input.verified) return false;
  return deriveEnrollmentFlagsFromLayers({
    enrollment_status: input.child_enrollment_status as ChildEnrollmentStatus | null,
    created_via: input.child_created_via,
    has_membership: input.membership_status != null,
    membership_plan: null,
    membership_status: input.membership_status as MembershipStatus | null,
    membership_fee_cents: input.membership_fee_cents ?? 0,
  }).needs_payment;
}
