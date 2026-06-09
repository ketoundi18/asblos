import { expect, type Page } from "@playwright/test";

/** Attend un toast Sonner (FlashToastHandler) par son titre. */
export async function expectFlashToast(page: Page, title: string | RegExp) {
  const toast = page.locator("[data-sonner-toast]").filter({ hasText: title });
  await expect(toast.first()).toBeVisible({ timeout: 15_000 });
}
