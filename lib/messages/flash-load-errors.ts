import type { FlashAudience, FlashToast } from "@/lib/messages/flash-types";

/** Messages de chargement — sans jargon technique pour le staff et les parents. */
export function friendlyLoadError(message: string, audience: FlashAudience): string {
  if (
    message.includes("migration") ||
    message.includes(".sql") ||
    message.includes("Supabase") ||
    message.includes("Lance ")
  ) {
    return audience === "staff"
      ? "Impossible de charger les données. Un réglage technique est peut-être nécessaire — contacte la personne qui gère AsblOS."
      : "Impossible de charger les données pour le moment. Contactez l'ASBL si cela continue.";
  }

  return "Impossible de charger les données. Réessayez dans un instant.";
}

export function resolveLoadErrorToast(
  message: string,
  audience: FlashAudience
): FlashToast {
  return {
    type: "error",
    title: "Chargement impossible",
    description: friendlyLoadError(message, audience),
  };
}

export function resolveCombinedLoadErrorToast(
  messages: Array<string | null | undefined>,
  audience: FlashAudience
): FlashToast | null {
  const errors = messages.filter((m): m is string => Boolean(m?.trim()));
  if (errors.length === 0) return null;

  return {
    type: "error",
    title:
      errors.length > 1
        ? "Plusieurs sections n'ont pas pu charger"
        : "Chargement impossible",
    description: friendlyLoadError(errors[0], audience),
  };
}
