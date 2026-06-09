import "./load-env";
import { expect, type Page } from "@playwright/test";

export type StaffCredentials = {
  email: string;
  password: string;
};

export function getStaffCredentials(): StaffCredentials | null {
  const email = process.env.E2E_STAFF_EMAIL?.trim();
  const password = process.env.E2E_STAFF_PASSWORD;
  if (!email || !password) return null;
  return { email, password };
}

export function requireStaffCredentials(): StaffCredentials {
  const creds = getStaffCredentials();
  if (!creds) {
    throw new Error(
      "Variables E2E_STAFF_EMAIL et E2E_STAFF_PASSWORD manquantes. " +
        "Ajoute-les dans .env.local (compte ADMIN ou TRAVAILLEUR — voir .env.local.example)."
    );
  }
  return creds;
}

export async function loginAsStaff(page: Page, creds?: StaffCredentials) {
  const { email, password } = creds ?? requireStaffCredentials();

  await page.goto("/connexion");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();

  await expect(page.getByRole("heading", { name: /Bonjour,/ })).toBeVisible({
    timeout: 30_000,
  });
  await expect(new URL(page.url()).pathname).toBe("/");
}
