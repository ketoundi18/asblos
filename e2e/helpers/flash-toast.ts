import { expect, type Page } from "@playwright/test";

/** Attend un toast Sonner (FlashToastHandler) ou le texte visible à l'écran. */
export async function expectFlashToast(page: Page, title: string | RegExp) {
  const toast = page.locator("[data-sonner-toast]").filter({ hasText: title });
  const inline = typeof title === "string" ? page.getByText(title, { exact: true }) : page.getByText(title);

  await expect(toast.first().or(inline.first())).toBeVisible({ timeout: 15_000 });
}
