import type { FlashToast } from "@/lib/messages/flash-types";

const STAFF_WARNING_MESSAGES: Record<string, FlashToast> = {
  "soutien-partial": {
    type: "info",
    title: "Inscription partielle",
    description:
      "La fiche enfant a été créée, mais l'inscription au programme de soutien n'a pas abouti. Complète-la depuis la fiche enfant.",
  },
};

export function resolveWarningFlashToast(warning: string): FlashToast {
  const known = STAFF_WARNING_MESSAGES[warning];
  if (known) return known;

  return {
    type: "info",
    title: "Information",
    description: "Une étape complémentaire peut être nécessaire. Vérifie la fiche concernée.",
  };
}
