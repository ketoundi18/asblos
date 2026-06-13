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

  test("inscription SCHOOL_SUPPORT + étape virement si disponible", async ({ page }) => {
    const { firstName, lastName } = uniqueChildName();

    await loginAsParent(page);
    await gotoParentEnrollment(page);

    await fillChildStepAndGoToFormula(page, firstName, lastName, "2014-03-15");
    await page.getByRole("radio", { name: /Inscription \+ soutien scolaire/i }).check();
    await submitFormulaStep(page);

    const virementLink = page.getByRole("link", { name: /Payer par virement/i });
    const skipDaysBtn = page.getByRole("button", { name: /Passer — choisir plus tard/i });
    const doneHeading = page.getByText("Inscription enregistrée");

    await expect(virementLink.or(skipDaysBtn).or(doneHeading)).toBeVisible({
      timeout: 30_000,
    });

    if (await skipDaysBtn.isVisible()) {
      await skipDaysBtn.click();
    }

    if (await virementLink.isVisible()) {
      await expect(virementLink).toBeEnabled();
      await virementLink.click();
      await expect(page).toHaveURL(/\/espace-parents\/paiement\/.+\?wizard=1/, {
        timeout: 15_000,
      });
      await expect(page.getByText(/Paiement par virement/i).first()).toBeVisible();
    } else {
      await expect(doneHeading).toBeVisible();
    }

    await expect(page.getByText(firstName).first()).toBeVisible({ timeout: 30_000 });
  });
});
