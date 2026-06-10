import { test, expect, type Page } from "@playwright/test";
import { getParentCredentials, loginAsParent } from "./helpers/parent-auth";

function uniqueChildName() {
  const suffix = Date.now().toString(36).slice(-6);
  return { firstName: `E2E${suffix}`, lastName: "Playwright" };
}

/** Confirme le dialog shadcn ajouté avant l'envoi du formulaire d'inscription. */
async function confirmEnrollmentDialog(page: Page) {
  const dialog = page.getByRole("dialog", { name: /Confirmer l'inscription/i });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: /Oui, enregistrer/i }).click();
}

test.describe("Parcours parent — inscription wizard", () => {
  test.beforeEach(() => {
    test.skip(!getParentCredentials(), "E2E_PARENT_EMAIL / E2E_PARENT_PASSWORD requis");
  });

  test("inscription BASE (gratuite) jusqu'à la confirmation", async ({ page }) => {
    const { firstName, lastName } = uniqueChildName();

    await loginAsParent(page);
    await page.goto("/espace-parents/inscrire");

    await expect(page.getByRole("heading", { name: /Inscrire un enfant/i })).toBeVisible();

    // Étape 1 — enfant (IDs uniques ; l'étape 2 est cachée dans le DOM)
    await expect(page.getByRole("heading", { name: "Étape 1 — Votre enfant" })).toBeVisible();
    await page.locator("#first_name").fill(firstName);
    await page.locator("#last_name").fill(lastName);
    await page.locator("#birth_date").fill("2015-09-01");
    await page.getByRole("button", { name: /Continuer — Formule/i }).click();

    await expect(
      page.locator('nav[aria-label="Étapes d\'inscription"] li').nth(1).locator(".bg-primary")
    ).toBeVisible({ timeout: 15_000 });
    await page.getByRole("radio", { name: /Inscription simple à l'ASBL/i }).check();

    const phone = page.locator("#guardian_phone");
    if ((await phone.inputValue()) === "") {
      await phone.fill("0470123456");
    }

    await page.getByRole("button", { name: "Enregistrer et continuer" }).click();
    await confirmEnrollmentDialog(page);

    // Étape terminée (BASE gratuit → pas de paiement)
    await expect(page.getByText("Inscription enregistrée")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(firstName).first()).toBeVisible();

    await page.getByRole("link", { name: /Retour — Mes enfants/i }).click();
    await expect(page).toHaveURL(/\/espace-parents\/?$/);
    await expect(
      page.getByRole("heading", { name: `${firstName} ${lastName}` })
    ).toBeVisible();
  });

  test("inscription SCHOOL_SUPPORT + simulation paiement si disponible", async ({
    page,
  }) => {
    const { firstName, lastName } = uniqueChildName();

    await loginAsParent(page);
    await page.goto("/espace-parents/inscrire");

    await page.locator("#first_name").fill(firstName);
    await page.locator("#last_name").fill(lastName);
    await page.locator("#birth_date").fill("2014-03-15");
    await page.getByRole("button", { name: /Continuer — Formule/i }).click();

    await expect(
      page.locator('nav[aria-label="Étapes d\'inscription"] li').nth(1).locator(".bg-primary")
    ).toBeVisible({ timeout: 15_000 });
    await page.getByRole("radio", { name: /Inscription \+ soutien scolaire/i }).check();

    const phone = page.locator("#guardian_phone");
    if ((await phone.inputValue()) === "") {
      await phone.fill("0470987654");
    }

    await page.getByRole("button", { name: "Enregistrer et continuer" }).click();
    await confirmEnrollmentDialog(page);

    // Jours (optionnel) ou paiement ou terminé selon config ASBL
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
      await expect(page.getByText("Inscription enregistrée")).toBeVisible({
        timeout: 30_000,
      });
    } else {
      await expect(doneHeading).toBeVisible();
    }

    await expect(page.getByText(firstName).first()).toBeVisible();
  });
});
