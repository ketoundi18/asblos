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
