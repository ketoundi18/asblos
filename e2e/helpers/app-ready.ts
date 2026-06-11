import { expect, type Page } from "@playwright/test";

/** Attend que Tailwind soit servi (évite wizard mort sans hydration). */
export async function waitForAppStyles(page: Page) {
  await page.goto("/connexion", { waitUntil: "domcontentloaded" });
  const cssHref = await page.evaluate(() => {
    const link = document.querySelector('link[rel="stylesheet"][href*="/_next/static/css/"]');
    return link?.getAttribute("href") ?? null;
  });
  expect(cssHref, "feuille CSS Next introuvable — lance npm run dev:clean").toBeTruthy();

  const status = await page.request.get(cssHref!);
  expect(status.ok(), `CSS ${cssHref} → HTTP ${status.status()}`).toBeTruthy();
  const body = await status.text();
  expect(body.length, "CSS layout trop petit — cache .next corrompu").toBeGreaterThan(5_000);
}
