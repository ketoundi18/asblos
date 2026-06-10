import { test, expect } from "@playwright/test";
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

    const form = page.locator("form").filter({ has: page.locator("#title") });
    await form.evaluate((el) => el.setAttribute("novalidate", "true"));
    await page.locator("#title").fill("   ");
    await page.getByRole("button", { name: "Créer le programme" }).click();

    await expect(page).toHaveURL(/error=title/, { timeout: 15_000 });
  });

  test("toast succès à la création puis erreur créneau sans heure", async ({ page }) => {
    await loginAsStaff(page);
    await page.goto("/soutien-scolaire/nouveau");

    const title = uniqueProgramTitle();
    await page.locator("#title").fill(title);
    await page.getByRole("button", { name: "Créer le programme" }).click();

    await expect(page).toHaveURL(/\/soutien-scolaire\/[0-9a-f-]+/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: title })).toBeVisible();

    const slotForm = page.locator("form").filter({ hasText: "Ajouter un créneau" });
    await slotForm.evaluate((form) => form.setAttribute("novalidate", "true"));
    await slotForm.locator("#start_time").fill("");
    await slotForm.getByRole("button", { name: "Ajouter le créneau" }).click();

    await expect(page).toHaveURL(/error=slot-time/, { timeout: 15_000 });

    await slotForm.locator("#start_time").fill("14:30");
    await slotForm.getByRole("button", { name: "Ajouter le créneau" }).click();

    await expect(page).toHaveURL(/success=slot-added/, { timeout: 15_000 });
    await expect(page.getByText(/14h30/)).toBeVisible();
  });
});
