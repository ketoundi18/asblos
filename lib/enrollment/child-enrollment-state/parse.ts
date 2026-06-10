import type {
  ChildEnrollmentStatus,
  MembershipPlan,
  MembershipStatus,
  SchoolSupportEnrollmentStatus,
} from "@/lib/constants/status";
import type {
  ChildEnrollmentState,
  ChildEnrollmentStateDerived,
  ChildEnrollmentStateLayerA,
  ChildEnrollmentStateLayerB,
  ChildEnrollmentStateLayerC,
} from "@/lib/enrollment/child-enrollment-state/types";

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
