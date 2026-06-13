/** Pages où la barre mobile et le FAB gênent les formulaires longs. */
export const PARENT_HIDE_MOBILE_CHROME_PREFIXES = [
  "/espace-parents/inscrire",
  "/espace-parents/paiement",
  "/espace-parents/paiement-activite",
  "/espace-parents/choisir-creneaux",
] as const;

export function shouldHideParentMobileChrome(pathname: string): boolean {
  return PARENT_HIDE_MOBILE_CHROME_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
}
