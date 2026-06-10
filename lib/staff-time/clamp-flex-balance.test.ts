import { describe, expect, it } from "vitest";
import { clampStaffFlexBalance } from "@/lib/staff-time/clamp-flex-balance";

describe("clampStaffFlexBalance", () => {
  const maxCredit = 480;

  it("additionne le delta au solde courant", () => {
    expect(clampStaffFlexBalance(100, 50, maxCredit)).toBe(150);
  });

  it("plafonne au max_credit_minutes (480 min par défaut contrat)", () => {
    expect(clampStaffFlexBalance(400, 200, maxCredit)).toBe(480);
  });

  it("ne dépasse pas le plafond même après plusieurs jours positifs", () => {
    let balance = 0;
    for (let day = 0; day < 5; day += 1) {
      balance = clampStaffFlexBalance(balance, 120, maxCredit);
    }
    expect(balance).toBe(480);
  });

  it("accepte un solde négatif (débit) sans plafond bas", () => {
    expect(clampStaffFlexBalance(-60, -30, maxCredit)).toBe(-90);
  });
});
