import { test, expect } from "@playwright/test";
import { getParentCredentials, loginAsParent } from "./helpers/parent-auth";

test.describe("Espace parents — connexion", () => {
  test("redirige vers la connexion si non authentifié", async ({ page }) => {
    await page.goto("/espace-parents/inscrire");
    await expect(page).toHaveURL(/\/espace-parents\/connexion/);
  });

  test("connexion parent puis accès à l'accueil", async ({ page }) => {
    test.skip(!getParentCredentials(), "E2E_PARENT_EMAIL / E2E_PARENT_PASSWORD requis");
    await loginAsParent(page);
    await expect(page.getByRole("link", { name: /Inscrire/ })).toBeVisible();
  });
});
