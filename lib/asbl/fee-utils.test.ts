import { describe, expect, it } from "vitest";
import {
  buildEnrollmentQuote,
  buildStaffEnrollmentQuote,
  formatEnrollmentFeeLabel,
  type AsblSettingsSnapshot,
} from "@/lib/asbl/fee-utils";

const settings: AsblSettingsSnapshot = {
  id: "settings-1",
  school_year: "2025-2026",
  enrollment_fee_cents: 3000,
  school_support_fee_cents: 5000,
  currency: "EUR",
};

describe("buildEnrollmentQuote", () => {
  it("formule BASE : gratuit, en attente validation ASBL", () => {
    const quote = buildEnrollmentQuote("BASE", settings);

    expect(quote.totalCents).toBe(0);
    expect(quote.needsPayment).toBe(false);
    expect(quote.membershipStatus).toBe("AWAITING_ASBL");
    expect(quote.enrollmentStatus).toBe("PAYE_EN_ATTENTE_ASBL");
    expect(quote.lines).toHaveLength(1);
  });

  it("soutien scolaire payant : cotisation + statuts paiement", () => {
    const quote = buildEnrollmentQuote("SCHOOL_SUPPORT", settings);

    expect(quote.totalCents).toBe(5000);
    expect(quote.needsPayment).toBe(true);
    expect(quote.membershipStatus).toBe("AWAITING_PAYMENT");
    expect(quote.enrollmentStatus).toBe("EN_ATTENTE_PAIEMENT");
  });

  it("soutien scolaire à 0 € : pas de paiement en ligne", () => {
    const freeSettings: AsblSettingsSnapshot = {
      ...settings,
      school_support_fee_cents: 0,
    };
    const quote = buildEnrollmentQuote("SCHOOL_SUPPORT", freeSettings);

    expect(quote.totalCents).toBe(0);
    expect(quote.needsPayment).toBe(false);
    expect(quote.membershipStatus).toBe("AWAITING_ASBL");
    expect(formatEnrollmentFeeLabel(0)).toBe("Gratuit");
  });
});

describe("buildStaffEnrollmentQuote", () => {
  it("staff + soutien gratuit : enfant validé immédiatement", () => {
    const freeSettings: AsblSettingsSnapshot = {
      ...settings,
      school_support_fee_cents: 0,
    };
    const quote = buildStaffEnrollmentQuote("SCHOOL_SUPPORT", freeSettings, false);

    expect(quote.totalCents).toBe(0);
    expect(quote.membershipStatus).toBe("ACTIVE");
    expect(quote.enrollmentStatus).toBe("VALIDE");
  });

  it("staff + cotisation due sans paiement reçu : en attente paiement", () => {
    const quote = buildStaffEnrollmentQuote("SCHOOL_SUPPORT", settings, false);

    expect(quote.totalCents).toBe(5000);
    expect(quote.membershipStatus).toBe("AWAITING_PAYMENT");
    expect(quote.enrollmentStatus).toBe("EN_ATTENTE_PAIEMENT");
  });
});
