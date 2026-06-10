import { test, expect } from "@playwright/test";
import { getStaffCredentials, loginAsStaff } from "./helpers/staff-auth";

test.describe("Staff — Équipe rapport mensuel", () => {
  test("admin accède au rapport mensuel", async ({ page }) => {
    test.skip(!getStaffCredentials(), "E2E_STAFF_EMAIL / E2E_STAFF_PASSWORD requis");

    await loginAsStaff(page);
    await page.goto("/equipe/rapport");

    if (!page.url().includes("/equipe/rapport")) {
      test.skip(true, "Compte non-admin — utilise un compte ADMIN pour ce test");
    }

    await expect(page.getByRole("heading", { name: "Rapport mensuel" })).toBeVisible();
    await expect(page.getByLabel("Mois")).toBeVisible();
    await expect(page.getByRole("button", { name: "Afficher" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Exporter CSV/i })).toBeVisible();
  });
});
