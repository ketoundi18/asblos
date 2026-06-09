import { test, expect } from "@playwright/test";
import { expectFlashToast } from "./helpers/flash-toast";
import { getStaffCredentials, loginAsStaff } from "./helpers/staff-auth";

function uniqueProgramTitle() {
  return `E2E Soutien ${Date.now().toString(36)}`;
}

test.describe("Staff — soutien scolaire (flash messages)", () => {
  test.beforeEach(() => {
    test.skip(!getStaffCredentials(), "E2E_STAFF_EMAIL / E2E_STAFF_PASSWORD requis");
  });

  test("toast erreur si titre vide à la création", async ({ page }) => {
    await loginAsStaff(page);
    await page.goto("/soutien-scolaire/nouveau");

    await expect(page.getByRole("heading", { name: /Nouveau programme/i })).toBeVisible();

    await page.locator("#title").fill("   ");
    await page.getByRole("button", { name: "Créer le programme" }).click();

    await expectFlashToast(page, "Titre obligatoire");
    await expect(page).toHaveURL(/\/soutien-scolaire\/nouveau/);
  });

  test("toast succès à la création puis erreur créneau sans heure", async ({ page }) => {
    await loginAsStaff(page);
    await page.goto("/soutien-scolaire/nouveau");

    const title = uniqueProgramTitle();
    await page.locator("#title").fill(title);
    await page.getByRole("button", { name: "Créer le programme" }).click();

    await expect(page).toHaveURL(/\/soutien-scolaire\/[0-9a-f-]+/);
    await expectFlashToast(page, "Programme créé");
    await expect(page.getByRole("heading", { name: title })).toBeVisible();

    const slotForm = page.locator("form").filter({ hasText: "Ajouter un créneau" });
    await slotForm.evaluate((form) => form.setAttribute("novalidate", "true"));
    await slotForm.locator("#start_time").fill("");
    await slotForm.getByRole("button", { name: "Ajouter le créneau" }).click();

    await expectFlashToast(page, "Heure invalide");

    await slotForm.locator("#start_time").fill("14:30");
    await slotForm.getByRole("button", { name: "Ajouter le créneau" }).click();

    await expectFlashToast(page, "Créneau ajouté");
    await expect(page.getByText(/14h30/)).toBeVisible();
  });
});
