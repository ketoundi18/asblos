export type FlashAudience = "parent" | "staff";

export type FlashToast = {
  type: "success" | "error" | "info";
  title: string;
  description?: string;
};

const FLASH_PARAM_KEYS = ["success", "error", "payment", "detail", "created", "toggled"] as const;

type ResolveInput = {
  success?: string | null;
  error?: string | null;
  payment?: string | null;
  detail?: string | null;
  created?: string | null;
  toggled?: string | null;
  audience: FlashAudience;
};

export function resolveFlashToast(input: ResolveInput): FlashToast | null {
  const { success, error, payment, detail, created, toggled, audience } = input;

  if (error) {
    return resolveErrorToast(error, detail, audience);
  }

  if (success) {
    return resolveSuccessToast(success, payment, audience);
  }

  if (created === "1") {
    return {
      type: "success",
      title: "Activité créée",
      description:
        audience === "staff"
          ? "Pensez à la publier aux parents si ce n'est pas déjà fait."
          : undefined,
    };
  }

  if (toggled === "parent") {
    return {
      type: "success",
      title: "Visibilité mise à jour",
      description: "L'espace parents affiche ou masque l'activité selon votre choix.",
    };
  }

  return null;
}

function resolveSuccessToast(
  code: string,
  payment: string | null | undefined,
  audience: FlashAudience
): FlashToast {
  const map: Record<string, FlashToast> = {
    inscription: {
      type: "success",
      title: "Inscription envoyée",
      description:
        audience === "parent"
          ? "L'ASBL va valider le dossier sous peu. Rien d'autre à faire pour l'instant."
          : "La fiche enfant a été enregistrée.",
    },
    paiement: {
      type: "success",
      title: "Paiement enregistré",
      description:
        audience === "parent"
          ? "Merci ! L'ASBL va confirmer l'inscription prochainement."
          : "Le paiement a bien été pris en compte.",
    },
    "deja-paye": {
      type: "success",
      title: "Déjà réglé",
      description: "Le paiement pour cet enfant est déjà enregistré.",
    },
    validated: {
      type: "success",
      title: "Parent validé",
      description: "Le parent voit maintenant son enfant dans l'espace parents.",
    },
    rejected: {
      type: "success",
      title: "Demande refusée",
      description: "La demande de lien parent-enfant a été supprimée.",
    },
    "fee-updated": {
      type: "success",
      title: "Cotisation mise à jour",
      description: "Le montant de la cotisation annuelle est enregistré.",
    },
    enrolled: {
      type: "success",
      title: "Inscription confirmée",
      description: "Votre enfant est inscrit au soutien scolaire pour cette année.",
    },
    "upgrade-soutien": {
      type: "success",
      title: "Soutien scolaire activé",
      description: "L'ASBL va valider le dossier. Vous pourrez ensuite inscrire votre enfant au soutien.",
    },
    published: {
      type: "success",
      title: "Publié aux parents",
      description: "Le programme apparaît maintenant dans l'espace parents → Soutien scolaire.",
    },
    "soutien-confirmed": {
      type: "success",
      title: "Soutien scolaire confirmé",
      description: "Le parent peut maintenant inscrire son enfant au programme.",
    },
    "soutien-enroll": {
      type: "success",
      title: "Inscrit au soutien scolaire",
      description: "L'enfant est inscrit au programme choisi.",
    },
    "soutien-slots": {
      type: "success",
      title: "Créneaux mis à jour",
      description: "Les jours souhaités ont été enregistrés.",
    },
    "soutien-activated": {
      type: "success",
      title: "Inscription validée",
      description: "Le soutien scolaire est actif pour cet enfant.",
    },
    "soutien-cancel": {
      type: "success",
      title: "Retiré du programme",
      description: "L'enfant n'est plus inscrit à ce programme de soutien.",
    },
    attendance: {
      type: "success",
      title: "Présence enregistrée",
      description: "C'est sauvegardé. Passez à l'enfant suivant.",
    },
  };

  if (code === "inscription" && payment === "pending" && audience === "parent") {
    return {
      type: "success",
      title: "Inscription confirmée",
      description:
        "Votre enfant participe à l'activité. Vous pourrez régler la participation quand vous le souhaitez.",
    };
  }

  return (
    map[code] ?? {
      type: "success",
      title: "C'est fait",
      description: "L'action s'est bien déroulée.",
    }
  );
}

function resolveErrorToast(
  code: string,
  detail: string | null | undefined,
  audience: FlashAudience
): FlashToast {
  const parentGeneric: FlashToast = {
    type: "error",
    title: "Un petit souci technique",
    description: "Réessayez dans un instant. Si le problème continue, contactez l'ASBL.",
  };

  const parentMap: Record<string, FlashToast> = {
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
    "base_plan": {
      type: "info",
      title: "Soutien scolaire non activé",
      description:
        "Activez la cotisation soutien scolaire depuis l'accueil parent pour inscrire votre enfant.",
    },
    "awaiting_payment": {
      type: "info",
      title: "Cotisation en attente",
      description:
        "Finalisez la cotisation soutien scolaire quand vous le souhaitez — sans pression.",
    },
    "awaiting_asbl": {
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
        detail ??
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
      description:
        "Utilisez le bouton de simulation en mode test, ou contactez l'ASBL.",
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
    db: parentGeneric,
    migration: parentGeneric,
    "membership-paid": {
      type: "error",
      title: "Adhésion non mise à jour",
      description:
        "Le paiement simulé n'a pas pu activer l'adhésion. Vérifie SUPABASE_SERVICE_ROLE_KEY ou contacte l'ASBL.",
    },
  };

  const staffMap: Record<string, FlashToast> = {
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
  };

  const map = audience === "parent" ? parentMap : staffMap;
  return map[code] ?? (audience === "parent" ? parentGeneric : {
    type: "error",
    title: "Action impossible",
    description: staffDetail(detail, "Réessaie ou vérifie la configuration."),
  });
}

function staffDetail(detail: string | null | undefined, fallback: string): string {
  if (!detail) return fallback;
  try {
    return `${fallback} Détail : ${decodeURIComponent(detail)}`;
  } catch {
    return `${fallback} Détail : ${detail}`;
  }
}

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

export function stripFlashParams(pathname: string, search: string): string {
  const params = new URLSearchParams(search);
  for (const key of FLASH_PARAM_KEYS) {
    params.delete(key);
  }
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function hasFlashParams(search: string): boolean {
  const params = new URLSearchParams(search);
  return FLASH_PARAM_KEYS.some((key) => params.has(key));
}
