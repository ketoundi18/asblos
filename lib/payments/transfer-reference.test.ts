import { describe, expect, it } from "vitest";
import {
  buildActivityPaymentTransferReference,
  buildTransferReference,
  formatIbanForDisplay,
  isValidIbanFormat,
  normalizeIban,
  suggestActivityTransferReference,
} from "@/lib/payments/transfer-reference";

describe("buildTransferReference", () => {
  it("génère une communication structurée unique", () => {
    const ref = buildTransferReference({
      schoolYear: "2025-2026",
      childId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      purpose: "MEMBERSHIP",
      paymentId: "11111111-2222-3333-4444-555555555555",
    });
    expect(ref).toMatch(/^ASBL-26-COT-[A-F0-9]{4}-[A-F0-9]{4}$/);
  });

  it("utilise ACT pour les activités", () => {
    const ref = buildTransferReference({
      schoolYear: "2025-2026",
      childId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      purpose: "ACTIVITY",
      paymentId: "11111111-2222-3333-4444-555555555555",
    });
    expect(ref).toContain("-ACT-");
  });
});

describe("IBAN helpers", () => {
  it("normalise et formate un IBAN", () => {
    const raw = "be68 5390 0754 7034";
    expect(normalizeIban(raw)).toBe("BE68539007547034");
    expect(formatIbanForDisplay(raw)).toBe("BE68 5390 0754 7034");
  });

  it("valide un format IBAN basique", () => {
    expect(isValidIbanFormat("BE68539007547034")).toBe(true);
    expect(isValidIbanFormat("123")).toBe(false);
  });
});

describe("buildActivityPaymentTransferReference", () => {
  it("produit une communication unique par enfant et paiement", () => {
    const childA = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    const childB = "bbbbbbbb-cccc-dddd-eeee-ffffffffffff";
    const payA = "11111111-2222-3333-4444-555555555555";
    const payB = "22222222-3333-4444-5555-666666666666";
    const base = "ASBL-ACT-FOOT-2606";

    const refA = buildActivityPaymentTransferReference({
      activityReference: base,
      childId: childA,
      paymentId: payA,
    });
    const refB = buildActivityPaymentTransferReference({
      activityReference: base,
      childId: childB,
      paymentId: payB,
    });

    expect(refA).not.toBe(refB);
    expect(refA.startsWith("ASBL-ACT-FOOT")).toBe(true);
    expect(refA.length).toBeLessThanOrEqual(40);
    expect(refB.length).toBeLessThanOrEqual(40);
  });
});

describe("suggestActivityTransferReference", () => {
  it("produit une communication lisible", () => {
    expect(
      suggestActivityTransferReference("Sortie au parc", "2026-06-15")
    ).toBe("ASBL-ACT-SORTIE-AU-PARC-2606");
  });
});
