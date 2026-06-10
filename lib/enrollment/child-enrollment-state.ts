import type {
  ChildEnrollmentStatus,
  MembershipPlan,
  MembershipStatus,
  SchoolSupportEnrollmentStatus,
} from "@/lib/constants/status";
import type { Membership } from "@/lib/data/memberships";

export type ChildEnrollmentStateLayerA = {
  enrollment_status: ChildEnrollmentStatus | null;
  created_via: string | null;
  asbl_validated_at: string | null;
};

export type ChildEnrollmentStateLayerB = {
  membership_id: string;
  parent_id: string;
  plan: MembershipPlan;
  status: MembershipStatus;
  fee_cents: number;
  asbl_validated_at: string | null;
};

export type ChildEnrollmentStateLayerC = {
  enrollment_id: string;
  status: SchoolSupportEnrollmentStatus;
  program_id: string;
};

export type ChildEnrollmentStateDerived = {
  has_membership: boolean;
  needs_payment: boolean;
  blocks_admin_validation: boolean;
  is_asbl_validated: boolean;
  is_rejected: boolean;
  is_school_support_pending_confirm: boolean;
  is_legacy_pending_asbl: boolean;
  has_program_enrollment: boolean;
  has_pending_program_enrollment: boolean;
  has_active_program_enrollment: boolean;
  effective_plan: MembershipPlan | null;
  effective_membership_status: MembershipStatus;
};

export type ChildEnrollmentState = {
  child_id: string;
  school_year: string;
  layer_a: ChildEnrollmentStateLayerA;
  layer_b: ChildEnrollmentStateLayerB | null;
  layer_c: ChildEnrollmentStateLayerC | null;
  link: {
    verified: boolean;
    parent_id: string | null;
  };
  derived: ChildEnrollmentStateDerived;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function readNumber(value: unknown): number {
  return typeof value === "number" ? value : 0;
}

function readBoolean(value: unknown): boolean {
  return value === true;
}

function parseLayerA(value: unknown): ChildEnrollmentStateLayerA {
  const row = isRecord(value) ? value : {};
  return {
    enrollment_status: readString(row.enrollment_status) as ChildEnrollmentStatus | null,
    created_via: readString(row.created_via),
    asbl_validated_at: readString(row.asbl_validated_at),
  };
}

function parseLayerB(value: unknown): ChildEnrollmentStateLayerB | null {
  if (!isRecord(value)) return null;
  const membershipId = readString(value.membership_id);
  const parentId = readString(value.parent_id);
  const plan = readString(value.plan) as MembershipPlan | null;
  const status = readString(value.status) as MembershipStatus | null;
  if (!membershipId || !parentId || !plan || !status) return null;
  return {
    membership_id: membershipId,
    parent_id: parentId,
    plan,
    status,
    fee_cents: readNumber(value.fee_cents),
    asbl_validated_at: readString(value.asbl_validated_at),
  };
}

function parseLayerC(value: unknown): ChildEnrollmentStateLayerC | null {
  if (!isRecord(value)) return null;
  const enrollmentId = readString(value.enrollment_id);
  const status = readString(value.status) as SchoolSupportEnrollmentStatus | null;
  const programId = readString(value.program_id);
  if (!enrollmentId || !status || !programId) return null;
  return {
    enrollment_id: enrollmentId,
    status,
    program_id: programId,
  };
}

function parseDerived(value: unknown): ChildEnrollmentStateDerived {
  const row = isRecord(value) ? value : {};
  const effectiveStatus =
    (readString(row.effective_membership_status) as MembershipStatus | null) ??
    "AWAITING_ASBL";
  const effectivePlan = readString(row.effective_plan) as MembershipPlan | null;
  return {
    has_membership: readBoolean(row.has_membership),
    needs_payment: readBoolean(row.needs_payment),
    blocks_admin_validation: readBoolean(row.blocks_admin_validation),
    is_asbl_validated: readBoolean(row.is_asbl_validated),
    is_rejected: readBoolean(row.is_rejected),
    is_school_support_pending_confirm: readBoolean(row.is_school_support_pending_confirm),
    is_legacy_pending_asbl: readBoolean(row.is_legacy_pending_asbl),
    has_program_enrollment: readBoolean(row.has_program_enrollment),
    has_pending_program_enrollment: readBoolean(row.has_pending_program_enrollment),
    has_active_program_enrollment: readBoolean(row.has_active_program_enrollment),
    effective_plan: effectivePlan,
    effective_membership_status: effectiveStatus,
  };
}

export function parseChildEnrollmentState(value: unknown): ChildEnrollmentState | null {
  if (!isRecord(value)) return null;
  const childId = readString(value.child_id);
  const schoolYear = readString(value.school_year);
  if (!childId || !schoolYear) return null;

  const link = isRecord(value.link) ? value.link : {};
  return {
    child_id: childId,
    school_year: schoolYear,
    layer_a: parseLayerA(value.layer_a),
    layer_b: parseLayerB(value.layer_b),
    layer_c: parseLayerC(value.layer_c),
    link: {
      verified: readBoolean(link.verified),
      parent_id: readString(link.parent_id),
    },
    derived: parseDerived(value.derived),
  };
}

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

/** Snapshot partiel (listes admin) — même règles que la RPC 040. */
export type EnrollmentLayersSnapshot = {
  enrollment_status: ChildEnrollmentStatus | null;
  created_via: string | null;
  has_membership: boolean;
  membership_plan: MembershipPlan | null;
  membership_status: MembershipStatus | null;
  membership_fee_cents: number;
};

export type DerivedEnrollmentFlags = Pick<
  ChildEnrollmentStateDerived,
  | "needs_payment"
  | "blocks_admin_validation"
  | "is_asbl_validated"
  | "is_rejected"
  | "is_school_support_pending_confirm"
  | "is_legacy_pending_asbl"
  | "effective_plan"
  | "effective_membership_status"
>;

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
