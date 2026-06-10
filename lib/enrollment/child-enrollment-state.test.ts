import { describe, expect, it } from "vitest";
import {
  deriveEnrollmentFlagsFromLayers,
  enrollmentStateBlocksAdminValidation,
  enrollmentStateIsSchoolSupportPendingConfirm,
  enrollmentStateNeedsPayment,
  mapMembershipStatusToEnrollmentStatus,
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

describe("mapMembershipStatusToEnrollmentStatus", () => {
  it("mappe membership → couche A comme la RPC 044", () => {
    expect(mapMembershipStatusToEnrollmentStatus("AWAITING_PAYMENT")).toBe(
      "EN_ATTENTE_PAIEMENT"
    );
    expect(mapMembershipStatusToEnrollmentStatus("AWAITING_ASBL")).toBe(
      "PAYE_EN_ATTENTE_ASBL"
    );
    expect(mapMembershipStatusToEnrollmentStatus("ACTIVE")).toBe("VALIDE");
    expect(mapMembershipStatusToEnrollmentStatus("REJECTED")).toBe("REFUSE");
    expect(mapMembershipStatusToEnrollmentStatus("CANCELLED")).toBe("REFUSE");
  });
});

describe("deriveEnrollmentFlagsFromLayers", () => {
  it("bloque validation admin si cotisation due (membership)", () => {
    const flags = deriveEnrollmentFlagsFromLayers({
      enrollment_status: null,
      created_via: "PARENT",
      has_membership: true,
      membership_plan: "SCHOOL_SUPPORT",
      membership_status: "AWAITING_PAYMENT",
      membership_fee_cents: 3000,
    });
    expect(flags.needs_payment).toBe(true);
    expect(flags.blocks_admin_validation).toBe(true);
  });

  it("bloque validation admin legacy parent sans membership", () => {
    const flags = deriveEnrollmentFlagsFromLayers({
      enrollment_status: "EN_ATTENTE_PAIEMENT",
      created_via: "PARENT",
      has_membership: false,
      membership_plan: null,
      membership_status: null,
      membership_fee_cents: 0,
    });
    expect(flags.blocks_admin_validation).toBe(true);
  });

  it("prêt à valider si payé ou cotisation nulle", () => {
    const flags = deriveEnrollmentFlagsFromLayers({
      enrollment_status: "PAYE_EN_ATTENTE_ASBL",
      created_via: "PARENT",
      has_membership: true,
      membership_plan: "SCHOOL_SUPPORT",
      membership_status: "AWAITING_ASBL",
      membership_fee_cents: 0,
    });
    expect(flags.blocks_admin_validation).toBe(false);
    expect(flags.needs_payment).toBe(false);
  });
});

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
