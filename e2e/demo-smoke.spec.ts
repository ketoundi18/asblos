import { test, expect } from "@playwright/test";
import { getStaffCredentials, loginAsStaff } from "./helpers/staff-auth";

/**
 * Parcours démo minimal — vérifie que les écrans clés se chargent sans erreur bloquante.
 * Nécessite E2E_STAFF_EMAIL / E2E_STAFF_PASSWORD (compte ADMIN recommandé).
 */
test.describe("Démo — écrans staff essentiels", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!getStaffCredentials(), "E2E_STAFF_EMAIL / E2E_STAFF_PASSWORD requis");
    await loginAsStaff(page);
  });

  test("Ma journée s'affiche", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Bonjour,/ })).toBeVisible();
  });

  test("Enfants — liste accessible", async ({ page }) => {
    await page.goto("/enfants");
    await expect(page.getByRole("heading", { name: /Enfants/i, level: 1 })).toBeVisible();
  });

  test("Équipe — hub et sous-pages", async ({ page }) => {
    await page.goto("/equipe");
    await expect(page.getByRole("heading", { name: "Équipe", level: 1 })).toBeVisible();

    await page.goto("/equipe/membres");
    await expect(page.getByRole("heading", { name: "Membres", level: 1 })).toBeVisible();

    await page.goto("/equipe/horaires");
    await expect(page.getByRole("heading", { name: "Objectifs horaires", level: 1 })).toBeVisible();

    await page.goto("/equipe/rapport");
    await expect(page.getByRole("heading", { name: "Rapport mensuel", level: 1 })).toBeVisible();
  });

  test("Familles & réglages accessible", async ({ page }) => {
    await page.goto("/administration");
    await expect(
      page.getByRole("heading", { name: "Familles & réglages", level: 1 })
    ).toBeVisible();
  });

  test("Rapports & journal accessible", async ({ page }) => {
    await page.goto("/rapports");
    await expect(page.getByRole("heading", { name: /Rapports/i, level: 1 })).toBeVisible();
  });
});
