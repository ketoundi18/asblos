import { test, expect } from "@playwright/test";
import { getClockStaffCredentials, gotoMonServiceOrSkip, hasClockStaffAccount, loginAsClockStaff } from "./helpers/staff-auth";

test.describe("Staff — Mon service (pointage)", () => {
  test("commencer puis terminer un service", async ({ page }) => {
    test.skip(
      !hasClockStaffAccount(),
      "E2E_CLOCK_STAFF_EMAIL requis (TRAVAILLEUR/STAGIAIRE/BENEVOLE — l'ADMIN ne peut pas pointer)"
    );
    test.skip(!getClockStaffCredentials(), "E2E_CLOCK_STAFF_EMAIL / E2E_CLOCK_STAFF_PASSWORD requis");

    await loginAsClockStaff(page);
    const ok = await gotoMonServiceOrSkip(page);
    test.skip(!ok, "Compte sans accès pointage (ADMIN seul) — définis E2E_CLOCK_STAFF_EMAIL (TRAVAILLEUR/STAGIAIRE/BENEVOLE)");

    const endButton = page.getByRole("button", { name: /Terminer mon service/i });
    if (await endButton.isVisible()) {
      await endButton.click();
      await expect(page.getByRole("button", { name: /Commencer mon service/i })).toBeVisible({
        timeout: 15_000,
      });
    }

    await page.getByRole("button", { name: /Commencer mon service/i }).click();
    await expect(page.getByRole("button", { name: /Terminer mon service/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("Tu es en service")).toBeVisible();

    await page.getByRole("button", { name: /Terminer mon service/i }).click();
    await expect(page.getByRole("button", { name: /Commencer mon service/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("Historique")).toBeVisible();
  });
});
