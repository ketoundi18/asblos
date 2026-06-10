import { test, expect } from "@playwright/test";
import { getStaffCredentials, loginAsStaff } from "./helpers/staff-auth";

test.describe("Staff — Équipe objectifs horaires", () => {
  test("admin accède à la page objectifs horaires", async ({ page }) => {
    test.skip(!getStaffCredentials(), "E2E_STAFF_EMAIL / E2E_STAFF_PASSWORD requis");

    await loginAsStaff(page);
    await page.goto("/equipe/horaires");

    if (!page.url().includes("/equipe/horaires")) {
      test.skip(true, "Compte non-admin — utilise un compte ADMIN pour ce test");
    }

    await expect(page.getByRole("heading", { name: "Objectifs horaires" })).toBeVisible();
    await expect(page.getByText("Définir un objectif")).toBeVisible();
    await expect(page.getByRole("button", { name: /Enregistrer l'objectif/i })).toBeVisible();
    await expect(
      page.getByText(/Objectifs actifs|Aucun objectif défini/)
    ).toBeVisible();
  });
});
