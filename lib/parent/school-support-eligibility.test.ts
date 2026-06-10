import { describe, expect, it } from "vitest";
import type { Membership } from "@/lib/data/memberships";
import { resolveSchoolSupportEnrollmentEligibility } from "@/lib/parent/school-support-eligibility";

function mockMembership(overrides: Partial<Membership> = {}): Membership {
  return {
    id: "mem-1",
    child_id: "child-1",
    parent_id: "parent-1",
    school_year: "2025-2026",
    plan: "SCHOOL_SUPPORT",
    fee_cents: 5000,
    status: "ACTIVE",
    asbl_validated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("resolveSchoolSupportEnrollmentEligibility", () => {
  it("refuse si pas d'adhésion", () => {
    const result = resolveSchoolSupportEnrollmentEligibility(null, false);

    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe("no_membership");
    }
  });

  it("refuse si cotisation soutien non payée", () => {
    const result = resolveSchoolSupportEnrollmentEligibility(
      mockMembership({ status: "AWAITING_PAYMENT", fee_cents: 5000 }),
      false
    );

    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe("awaiting_payment");
      expect(result.actionHref).toContain("/espace-parents/paiement/");
    }
  });

  it("AWAITING_PAYMENT à 0 € : pas de blocage paiement mais statut pas encore ACTIVE", () => {
    const result = resolveSchoolSupportEnrollmentEligibility(
      mockMembership({ status: "AWAITING_PAYMENT", fee_cents: 0 }),
      false
    );

    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe("not_active");
    }
  });

  it("refuse si créneaux déjà enregistrés", () => {
    const result = resolveSchoolSupportEnrollmentEligibility(
      mockMembership({ status: "AWAITING_ASBL" }),
      true
    );

    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe("already_enrolled");
    }
  });

  it("oriente vers le choix des jours si adhésion active sans inscription programme", () => {
    const result = resolveSchoolSupportEnrollmentEligibility(
      mockMembership({ status: "ACTIVE" }),
      false
    );

    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe("choose_days");
      expect(result.actionHref).toContain("/espace-parents/choisir-creneaux/");
    }
  });
});
