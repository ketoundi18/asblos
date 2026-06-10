import { describe, expect, it } from "vitest";
import {
  enrollmentStateBlocksAdminValidation,
  enrollmentStateIsSchoolSupportPendingConfirm,
  enrollmentStateNeedsPayment,
  parseChildEnrollmentState,
} from "@/lib/enrollment/child-enrollment-state";

function buildState(overrides: {
  layer_a?: Record<string, unknown>;
  layer_b?: Record<string, unknown> | null;
  derived?: Record<string, unknown>;
}) {
  return parseChildEnrollmentState({
    child_id: "11111111-1111-1111-1111-111111111111",
    school_year: "2025-2026",
    layer_a: {
      enrollment_status: "EN_ATTENTE_PAIEMENT",
      created_via: "PARENT",
      asbl_validated_at: null,
      ...overrides.layer_a,
    },
    layer_b: overrides.layer_b === null ? null : {
      membership_id: "22222222-2222-2222-2222-222222222222",
      parent_id: "33333333-3333-3333-3333-333333333333",
      plan: "SCHOOL_SUPPORT",
      status: "AWAITING_PAYMENT",
      fee_cents: 3000,
      asbl_validated_at: null,
      ...overrides.layer_b,
    },
    layer_c: null,
    link: { verified: false, parent_id: null },
    derived: {
      has_membership: overrides.layer_b !== null,
      needs_payment: false,
      blocks_admin_validation: false,
      is_asbl_validated: false,
      is_rejected: false,
      is_school_support_pending_confirm: false,
      is_legacy_pending_asbl: false,
      has_program_enrollment: false,
      has_pending_program_enrollment: false,
      has_active_program_enrollment: false,
      effective_plan: "SCHOOL_SUPPORT",
      effective_membership_status: "AWAITING_PAYMENT",
      ...overrides.derived,
    },
  })!;
}

describe("parseChildEnrollmentState", () => {
  it("retourne null si le payload est invalide", () => {
    expect(parseChildEnrollmentState(null)).toBeNull();
    expect(parseChildEnrollmentState({})).toBeNull();
  });
});

describe("enrollmentStateNeedsPayment", () => {
  it("lit le flag derived.needs_payment", () => {
    const state = buildState({ derived: { needs_payment: true } });
    expect(enrollmentStateNeedsPayment(state)).toBe(true);
  });
});

describe("enrollmentStateBlocksAdminValidation", () => {
  it("bloque si derived.blocks_admin_validation", () => {
    const state = buildState({ derived: { blocks_admin_validation: true } });
    expect(enrollmentStateBlocksAdminValidation(state)).toBe(true);
  });
});

describe("enrollmentStateIsSchoolSupportPendingConfirm", () => {
  it("autorise AWAITING_ASBL soutien scolaire", () => {
    const state = buildState({
      layer_b: {
        plan: "SCHOOL_SUPPORT",
        status: "AWAITING_ASBL",
        fee_cents: 3000,
      },
      derived: {
        is_school_support_pending_confirm: true,
        effective_membership_status: "AWAITING_ASBL",
      },
    });
    expect(enrollmentStateIsSchoolSupportPendingConfirm(state)).toBe(true);
  });

  it("autorise legacy PAYE_EN_ATTENTE_ASBL sans membership", () => {
    const state = buildState({
      layer_a: { enrollment_status: "PAYE_EN_ATTENTE_ASBL" },
      layer_b: null,
      derived: {
        has_membership: false,
        is_legacy_pending_asbl: true,
        is_school_support_pending_confirm: true,
        effective_membership_status: "AWAITING_ASBL",
        effective_plan: null,
      },
    });
    expect(enrollmentStateIsSchoolSupportPendingConfirm(state)).toBe(true);
  });
});
