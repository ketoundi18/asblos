import { expect, type Page } from "@playwright/test";

export function uniqueChildName() {
  const suffix = Date.now().toString(36).slice(-6);
  return { firstName: `E2E${suffix}`, lastName: "Playwright" };
}

export async function gotoParentEnrollment(page: Page) {
  await page.goto("/espace-parents/inscrire", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: /Inscrire un enfant/i })).toBeVisible();
}

export async function fillChildStepAndGoToFormula(
  page: Page,
  firstName: string,
  lastName: string,
  birthDate: string
) {
  await expect(page.getByRole("heading", { name: "Étape 1 — Votre enfant" })).toBeVisible();
  await page.locator("#first_name").fill(firstName);
  await page.locator("#last_name").fill(lastName);
  await page.locator("#birth_date").fill(birthDate);
  await expect(page.locator("#birth_date")).toHaveValue(birthDate);
  await page.getByRole("button", { name: /Continuer — Formule/i }).click();
  await expect(page.getByRole("heading", { name: "Étape 2 — Parent & formule" })).toBeVisible({
    timeout: 15_000,
  });
}

export async function submitFormulaStep(page: Page) {
  const phone = page.locator("#guardian_phone");
  if ((await phone.inputValue()) === "") {
    await phone.fill("0470123456");
  }

  await page.getByRole("button", { name: "Enregistrer et continuer" }).click();
  const dialog = page.getByRole("dialog", { name: /Confirmer l'inscription/i });
  await expect(dialog).toBeVisible({ timeout: 15_000 });
  await dialog.getByRole("button", { name: /Oui, enregistrer/i }).click();
}

export async function expectChildOnParentDashboard(
  page: Page,
  firstName: string,
  lastName: string
) {
  await expect(page.getByRole("heading", { name: /Bonjour,/ })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: `${firstName} ${lastName}` })
  ).toBeVisible({ timeout: 30_000 });
}
