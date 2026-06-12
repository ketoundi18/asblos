import { describe, expect, it } from "vitest";
import { hasPasswordRecoveryAmr } from "./recovery-session";

describe("hasPasswordRecoveryAmr", () => {
  it("accepte amr otp (objet Supabase)", () => {
    expect(
      hasPasswordRecoveryAmr([{ method: "otp", timestamp: 1715766000 }])
    ).toBe(true);
  });

  it("accepte amr recovery (string RFC)", () => {
    expect(hasPasswordRecoveryAmr(["recovery"])).toBe(true);
  });

  it("refuse une session password normale", () => {
    expect(hasPasswordRecoveryAmr([{ method: "password", timestamp: 1 }])).toBe(
      false
    );
  });

  it("refuse amr absent ou vide", () => {
    expect(hasPasswordRecoveryAmr(undefined)).toBe(false);
    expect(hasPasswordRecoveryAmr([])).toBe(false);
  });
});
