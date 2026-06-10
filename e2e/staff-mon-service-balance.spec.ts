import { test, expect } from "@playwright/test";
import { getClockStaffCredentials, gotoMonServiceOrSkip, hasClockStaffAccount, loginAsClockStaff } from "./helpers/staff-auth";

test.describe("Staff — Mon service (solde phase 4)", () => {
  test("affiche le solde et les mouvements du solde", async ({ page }) => {
    test.skip(
      !hasClockStaffAccount(),
      "E2E_CLOCK_STAFF_EMAIL requis (TRAVAILLEUR/STAGIAIRE/BENEVOLE — l'ADMIN ne peut pas pointer)"
    );
    test.skip(!getClockStaffCredentials(), "E2E_CLOCK_STAFF_EMAIL / E2E_CLOCK_STAFF_PASSWORD requis");

    await loginAsClockStaff(page);
    const ok = await gotoMonServiceOrSkip(page);
    test.skip(!ok, "Compte sans accès pointage — définis E2E_CLOCK_STAFF_EMAIL (TRAVAILLEUR/STAGIAIRE/BENEVOLE)");

    await expect(page.getByText("Solde de flexibilité")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Mouvements du solde" })).toBeVisible();
  });
});
