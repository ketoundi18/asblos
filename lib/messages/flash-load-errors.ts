import type { FlashAudience, FlashToast } from "@/lib/messages/flash-types";

const LOAD_ERROR_TOASTS: Partial<Record<string, Omit<FlashToast, "type"> & { type?: FlashToast["type"] }>> =
  {
    migration_required: {
      title: "Module pas encore disponible",
      description:
        "Cette fonctionnalité n'est pas encore activée sur cette instance. Contacte la personne qui gère AsblOS.",
    },
  };

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
  const known = LOAD_ERROR_TOASTS[message];
  if (known) {
    return {
      type: "error",
      title: known.title ?? "Chargement impossible",
      description:
        audience === "parent"
          ? "Impossible de charger les données pour le moment. Contactez l'ASBL si cela continue."
          : (known.description ?? friendlyLoadError(message, audience)),
    };
  }

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

const PARTIAL_LOAD_LABELS: Record<string, string> = {
  balance_unavailable: "le solde de flexibilité",
  contract_unavailable: "l'objectif horaire",
  ledger_unavailable: "l'historique du solde",
  migration_required: "certaines sections du module horaire",
};

/** Bandeau discret quand le pointage charge mais solde/contrat/ledger échouent. */
export function resolvePartialLoadToast(
  codes: string[],
  audience: FlashAudience
): FlashToast | null {
  if (codes.length === 0) return null;

  const labels = codes
    .map((code) => PARTIAL_LOAD_LABELS[code] ?? "une section")
    .filter((label, index, arr) => arr.indexOf(label) === index);

  const sections =
    labels.length === 1
      ? labels[0]
      : `${labels.slice(0, -1).join(", ")} et ${labels[labels.length - 1]}`;

  const staffDescription =
    codes.includes("migration_required")
      ? "Le pointage fonctionne. Un réglage technique est nécessaire pour afficher toutes les sections — contacte la personne qui gère AsblOS."
      : `Le pointage fonctionne. ${sections.charAt(0).toUpperCase()}${sections.slice(1)} ${labels.length > 1 ? "ne se chargent" : "ne se charge"} pas pour le moment — réessayez dans un instant.`;

  return {
    type: "info",
    title: labels.length > 1 ? "Affichage partiel" : "Section temporairement indisponible",
    description:
      audience === "parent"
        ? "Impossible de charger toutes les informations pour le moment. Contactez l'ASBL si cela continue."
        : staffDescription,
  };
}
