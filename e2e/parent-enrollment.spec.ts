import { test, expect } from "@playwright/test";
import { getParentCredentials, loginAsParent } from "./helpers/parent-auth";
import {
  expectChildOnParentDashboard,
  fillChildStepAndGoToFormula,
  gotoParentEnrollment,
  submitFormulaStep,
  uniqueChildName,
} from "./helpers/parent-enrollment";

test.describe("Parcours parent — inscription wizard", () => {
  test.beforeEach(() => {
    test.skip(!getParentCredentials(), "E2E_PARENT_EMAIL / E2E_PARENT_PASSWORD requis");
  });

  test("inscription BASE (gratuite) jusqu'à la confirmation", async ({ page }) => {
    const { firstName, lastName } = uniqueChildName();

    await loginAsParent(page);
    await gotoParentEnrollment(page);

    await fillChildStepAndGoToFormula(page, firstName, lastName, "2015-09-01");
    await page.getByRole("radio", { name: /Inscription simple à l'ASBL/i }).check();
    await submitFormulaStep(page);

    await expect(page.getByText("Inscription enregistrée")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(firstName).first()).toBeVisible();

    await page.getByRole("link", { name: /Retour — Mes enfants/i }).click();
    await expect(page).toHaveURL(/\/espace-parents\/?$/);
    await expectChildOnParentDashboard(page, firstName, lastName);
  });

  test("inscription SCHOOL_SUPPORT + simulation paiement si disponible", async ({
    page,
  }) => {
    const { firstName, lastName } = uniqueChildName();

    await loginAsParent(page);
    await gotoParentEnrollment(page);

    await fillChildStepAndGoToFormula(page, firstName, lastName, "2014-03-15");
    await page.getByRole("radio", { name: /Inscription \+ soutien scolaire/i }).check();
    await submitFormulaStep(page);

    const simulateBtn = page.getByRole("button", {
      name: /Simuler le paiement Bancontact/i,
    });
    const skipDaysBtn = page.getByRole("button", { name: /Passer — choisir plus tard/i });
    const doneHeading = page.getByText("Inscription enregistrée");

    await expect(simulateBtn.or(skipDaysBtn).or(doneHeading)).toBeVisible({
      timeout: 30_000,
    });

    if (await skipDaysBtn.isVisible()) {
      await skipDaysBtn.click();
    }

    if (await simulateBtn.isVisible()) {
      await simulateBtn.click();
      await expect(page).toHaveURL(/\/espace-parents/, { timeout: 30_000 });
    } else {
      await expect(doneHeading).toBeVisible();
    }

    await expect(page.getByText(firstName).first()).toBeVisible({ timeout: 30_000 });
  });
});
