import type {
  ChildEnrollmentStatus,
  MembershipPlan,
  MembershipStatus,
  SchoolSupportEnrollmentStatus,
} from "@/lib/constants/status";

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
