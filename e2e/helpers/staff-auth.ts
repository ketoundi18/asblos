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

/** Compte TRAVAILLEUR / STAGIAIRE / BENEVOLE pour /mon-service (fallback : E2E_STAFF_*). */
export function getClockStaffCredentials(): StaffCredentials | null {
  const email =
    process.env.E2E_CLOCK_STAFF_EMAIL?.trim() ?? process.env.E2E_STAFF_EMAIL?.trim();
  const password =
    process.env.E2E_CLOCK_STAFF_PASSWORD ?? process.env.E2E_STAFF_PASSWORD;
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

export async function loginAsClockStaff(page: Page) {
  const creds = getClockStaffCredentials();
  if (!creds) {
    throw new Error(
      "E2E_CLOCK_STAFF_EMAIL / E2E_CLOCK_STAFF_PASSWORD (ou E2E_STAFF_*) requis pour Mon service."
    );
  }
  await loginAsStaff(page, creds);
}

/** Navigue vers /mon-service ; retourne false si le compte n'a pas accès (ex. ADMIN seul). */
export async function gotoMonServiceOrSkip(page: Page): Promise<boolean> {
  await page.goto("/mon-service", { waitUntil: "networkidle" });
  const pathname = new URL(page.url()).pathname;
  if (pathname !== "/mon-service") {
    return false;
  }
  await expect(page.getByRole("heading", { name: "Mon service" })).toBeVisible();
  return true;
}

/** true si un compte pointage dédié est configuré (pas seulement ADMIN). */
export function hasClockStaffAccount(): boolean {
  return Boolean(process.env.E2E_CLOCK_STAFF_EMAIL?.trim());
}
