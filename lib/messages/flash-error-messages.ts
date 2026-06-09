import type { FlashAudience, FlashToast } from "@/lib/messages/flash-types";

export function staffDetail(
  detail: string | null | undefined,
  fallback: string
): string {
  if (!detail) return fallback;
  try {
    return `${fallback} Détail : ${decodeURIComponent(detail)}`;
  } catch {
    return `${fallback} Détail : ${detail}`;
  }
}

const PARENT_GENERIC: FlashToast = {
  type: "error",
  title: "Un petit souci technique",
  description:
    "Réessayez dans un instant. Si le problème continue, contactez l'ASBL.",
};

const PARENT_ERROR_MESSAGES: Record<string, FlashToast> = {
  inactive: {
    type: "error",
    title: "Compte désactivé",
    description: "Contactez l'ASBL pour réactiver votre accès.",
  },
  payment: {
    type: "error",
    title: "Paiement impossible",
    description: "Réessayez ou contactez l'ASBL pour vous aider.",
  },
  "payment-required": {
    type: "error",
    title: "Paiement non confirmé",
    description:
      "Aucun paiement reçu pour cet enfant. Payez ou utilisez la simulation avant de continuer.",
  },
  inscription: {
    type: "error",
    title: "Inscription impossible",
    description: "Votre enfant est peut-être déjà inscrit, ou l'activité n'est plus ouverte.",
  },
  child: {
    type: "error",
    title: "Choix manquant",
    description: "Sélectionnez un enfant avant de continuer.",
  },
  closed: {
    type: "error",
    title: "Activité fermée",
    description: "Cette activité n'accepte plus d'inscriptions en ligne.",
  },
  cotisation: {
    type: "info",
    title: "Cotisation en attente",
    description:
      "Vous pouvez finaliser la cotisation quand vous le souhaitez — sans pression. Ensuite, l'inscription aux activités sera possible.",
  },
  "cotisation-pending": {
    type: "info",
    title: "Dossier en cours de validation",
    description:
      "L'ASBL examine encore le dossier de votre enfant. Vous pourrez inscrire aux activités dès que c'est validé.",
  },
  "cotisation-refused": {
    type: "error",
    title: "Inscription non active",
    description: "Contactez l'ASBL si vous avez des questions sur le dossier de votre enfant.",
  },
  "not-verified": {
    type: "info",
    title: "Lien parent-enfant en attente",
    description:
      "L'ASBL doit d'abord valider le lien avec votre enfant avant toute inscription aux activités.",
  },
  base_plan: {
    type: "info",
    title: "Soutien scolaire non activé",
    description:
      "Activez la cotisation soutien scolaire depuis l'accueil parent pour inscrire votre enfant.",
  },
  awaiting_payment: {
    type: "info",
    title: "Cotisation en attente",
    description:
      "Finalisez la cotisation soutien scolaire quand vous le souhaitez — sans pression.",
  },
  awaiting_asbl: {
    type: "info",
    title: "Dossier en validation",
    description: "L'ASBL examine le dossier. L'inscription au soutien sera possible ensuite.",
  },
  already: {
    type: "info",
    title: "Déjà inscrit",
    description: "Votre enfant participe déjà à ce programme de soutien scolaire.",
  },
  full: {
    type: "error",
    title: "Complet",
    description: "Ce programme n'a plus de places disponibles. Contactez l'ASBL.",
  },
  enroll: {
    type: "error",
    title: "Inscription impossible",
    description: "Réessayez ou contactez l'ASBL pour vous aider.",
  },
  upgrade: {
    type: "error",
    title: "Activation impossible",
    description:
      "La demande n'a pas pu être enregistrée. Contactez l'ASBL (migration 020 à lancer dans Supabase).",
  },
  link: {
    type: "error",
    title: "Lien non validé",
    description: "L'ASBL doit d'abord valider le lien avec votre enfant.",
  },
  membership: {
    type: "error",
    title: "Adhésion manquante",
    description: "Rechargez la page (Cmd+Shift+R) ou contactez l'ASBL.",
  },
  "program-closed": {
    type: "error",
    title: "Programme fermé",
    description: "Ce programme de soutien scolaire n'accepte plus d'inscriptions.",
  },
  permission: {
    type: "error",
    title: "Accès refusé",
    description: "Vous n'avez pas la permission pour cette action.",
  },
  config: {
    type: "error",
    title: "Paiement temporairement indisponible",
    description: "Utilisez le bouton de simulation en mode test, ou contactez l'ASBL.",
  },
  simulation: {
    type: "error",
    title: "Simulation indisponible",
    description: "Cette option n'est active qu'en développement local.",
  },
  mollie: {
    type: "error",
    title: "Paiement en ligne indisponible",
    description: "Utilisez la simulation en local ou contactez l'ASBL.",
  },
  checkout: {
    type: "error",
    title: "Paiement interrompu",
    description: "Réessayez ou choisissez un autre moyen de paiement.",
  },
  db: PARENT_GENERIC,
  migration: PARENT_GENERIC,
  "membership-paid": {
    type: "error",
    title: "Cotisation non activée",
    description:
      "Le paiement est enregistré, mais la cotisation n'a pas encore pu être activée. Réessayez ou contactez l'ASBL.",
  },
  resume: {
    type: "error",
    title: "Reprise impossible",
    description: "Recommencez l'inscription depuis le début.",
  },
};

function buildStaffErrorMessages(
  detail: string | null | undefined
): Record<string, FlashToast> {
  return {
    inactive: {
      type: "error",
      title: "Compte désactivé",
      description: "Contacte un administrateur AsblOS pour réactiver ton accès.",
    },
    permission: {
      type: "error",
      title: "Permission refusée",
      description: "Tu n'as pas les droits pour cette action.",
    },
    "payment-required": {
      type: "info",
      title: "Paiement en attente",
      description: "Le parent doit d'abord régler la cotisation avant validation.",
    },
    validate: {
      type: "error",
      title: "Validation impossible",
      description: staffDetail(detail, "Vérifie le lien parent-enfant et réessaie."),
    },
    reject: {
      type: "error",
      title: "Refus impossible",
      description: staffDetail(detail, "Lance 009_parent_links_delete.sql si la migration manque."),
    },
    fee: {
      type: "error",
      title: "Cotisation non enregistrée",
      description: staffDetail(detail, "Lance 014_memberships_v2.sql dans Supabase."),
    },
    "fee-save": {
      type: "error",
      title: "Erreur d'enregistrement",
      description: staffDetail(detail, "Lance 014_memberships_v2.sql dans Supabase."),
    },
    inscription: {
      type: "error",
      title: "Inscription impossible",
      description: "L'enfant est peut-être déjà inscrit à cette activité.",
    },
    notfound: {
      type: "error",
      title: "Introuvable",
      description: "Cette activité n'existe plus ou a été supprimée.",
    },
    toggle: {
      type: "error",
      title: "Visibilité non modifiée",
      description: staffDetail(detail, "Vérifie la migration 012 dans Supabase."),
    },
    archive: {
      type: "error",
      title: "Archivage impossible",
      description: staffDetail(detail, "Réessaie ou vérifie les permissions."),
    },
    db: {
      type: "error",
      title: "Erreur base de données",
      description: staffDetail(detail, "Consulte les migrations Supabase."),
    },
    migration: {
      type: "error",
      title: "Migration manquante",
      description: staffDetail(detail, "Lance le script SQL indiqué dans Supabase."),
    },
    migration_required: {
      type: "error",
      title: "Migration manquante",
      description:
        "Applique la migration 028 (anonymize_child) dans Supabase SQL Editor avant d'anonymiser une fiche.",
    },
    already_anonymized: {
      type: "error",
      title: "Déjà anonymisée",
      description: "Cette fiche enfant a déjà été anonymisée.",
    },
    anonymize: {
      type: "error",
      title: "Anonymisation impossible",
      description: "Réessayez ou contactez la personne qui gère AsblOS.",
    },
    "soutien-confirmed": {
      type: "success",
      title: "Soutien scolaire confirmé",
      description: "Le parent peut maintenant inscrire son enfant au programme.",
    },
    "soutien-not-found": {
      type: "error",
      title: "Demande introuvable",
      description: "Recharge la page ou vérifie que le parent a bien activé le soutien.",
    },
    "soutien-confirm": {
      type: "error",
      title: "Confirmation impossible",
      description: staffDetail(detail, "Réessaie ou vérifie les migrations 017–020."),
    },
    "soutien-program": {
      type: "error",
      title: "Programme manquant",
      description: "Choisis un programme ouvert avant de valider.",
    },
    "soutien-parent": {
      type: "error",
      title: "Compte parent requis",
      description:
        "Lie un compte parent (e-mail du tuteur) avant d'inscrire au soutien scolaire.",
    },
    "soutien-membership": {
      type: "error",
      title: "Adhésion impossible",
      description: staffDetail(detail, "Vérifie la migration 022 dans Supabase."),
    },
    "soutien-enroll": {
      type: "error",
      title: "Inscription au programme impossible",
      description: staffDetail(detail, "Le programme est peut-être complet ou fermé."),
    },
    "soutien-slots": {
      type: "error",
      title: "Créneaux invalides",
      description: "Un ou plusieurs créneaux ne sont plus disponibles.",
    },
    "soutien-payment": {
      type: "error",
      title: "Cotisation en attente",
      description: "La cotisation doit être réglée avant de valider le soutien.",
    },
    "soutien-cancel": {
      type: "error",
      title: "Annulation impossible",
      description: "Réessaie ou recharge la page.",
    },
    title: {
      type: "error",
      title: "Titre obligatoire",
      description: "Indique un titre pour le programme de soutien scolaire.",
    },
    save: {
      type: "error",
      title: "Programme non enregistré",
      description: staffDetail(
        detail,
        "Le programme n'a pas pu être créé. Vérifie les migrations 017+ dans Supabase."
      ),
    },
    update: {
      type: "error",
      title: "Mise à jour impossible",
      description: staffDetail(
        detail,
        "Les modifications n'ont pas pu être enregistrées. Recharge la page et réessaie."
      ),
    },
    "slot-day": {
      type: "error",
      title: "Jour invalide",
      description: "Choisis un jour de la semaine (lundi à dimanche).",
    },
    "slot-time": {
      type: "error",
      title: "Heure invalide",
      description: "Indique au minimum une heure de début pour le créneau.",
    },
    "slot-save": {
      type: "error",
      title: "Créneau non enregistré",
      description: staffDetail(
        detail,
        "Le créneau n'a pas pu être ajouté. Vérifie les migrations 017+ dans Supabase."
      ),
    },
  };
}

export function resolveErrorFlashToast(
  code: string,
  detail: string | null | undefined,
  audience: FlashAudience
): FlashToast {
  if (audience === "parent") {
    if (code === "upgrade" && detail) {
      return {
        type: "error",
        title: "Activation impossible",
        description: detail,
      };
    }
    return PARENT_ERROR_MESSAGES[code] ?? PARENT_GENERIC;
  }

  const staffMap = buildStaffErrorMessages(detail);
  return (
    staffMap[code] ?? {
      type: "error",
      title: "Action impossible",
      description: staffDetail(detail, "Réessaie ou vérifie la configuration."),
    }
  );
}

export function resolveWarningFlashToast(warning: string): FlashToast {
  let description = warning;
  try {
    description = decodeURIComponent(warning);
  } catch {
    // keep raw
  }
  return {
    type: "info",
    title: "Information",
    description,
  };
}
