import { test, expect } from "@playwright/test";
import { getStaffCredentials, loginAsStaff } from "./helpers/staff-auth";

test.describe("Staff — connexion", () => {
  test("redirige vers la connexion si non authentifié", async ({ page }) => {
    await page.goto("/soutien-scolaire");
    await expect(page).toHaveURL(/\/connexion/);
  });

  test("connexion staff puis accès à Ma journée", async ({ page }) => {
    test.skip(!getStaffCredentials(), "E2E_STAFF_EMAIL / E2E_STAFF_PASSWORD requis");
    await loginAsStaff(page);
    await expect(page.getByRole("heading", { name: /Bonjour,/ })).toBeVisible();
  });
});
