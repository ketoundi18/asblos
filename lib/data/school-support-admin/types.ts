import type { MembershipPlan, MembershipStatus } from "@/lib/data/memberships";

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
  program_enrollment_status: string | null;
};

export type SchoolSupportEnrollmentDetails = {
  program_title: string | null;
  slot_labels: string[];
  program_enrollment_status: string | null;
};
