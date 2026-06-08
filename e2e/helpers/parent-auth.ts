import "./load-env";
import { expect, type Page } from "@playwright/test";

export type ParentCredentials = {
  email: string;
  password: string;
};

export function getParentCredentials(): ParentCredentials | null {
  const email = process.env.E2E_PARENT_EMAIL?.trim();
  const password = process.env.E2E_PARENT_PASSWORD;
  if (!email || !password) return null;
  return { email, password };
}

export function requireParentCredentials(): ParentCredentials {
  const creds = getParentCredentials();
  if (!creds) {
    throw new Error(
      "Variables E2E_PARENT_EMAIL et E2E_PARENT_PASSWORD manquantes. " +
        "Ajoute-les dans .env.local (voir .env.local.example)."
    );
  }
  return creds;
}

export async function loginAsParent(page: Page, creds?: ParentCredentials) {
  const { email, password } = creds ?? requireParentCredentials();

  await page.goto("/espace-parents/connexion");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();

  await expect(page).toHaveURL(/\/espace-parents\/?$/);
  await expect(page.getByText(/Bonjour,/)).toBeVisible();
}
