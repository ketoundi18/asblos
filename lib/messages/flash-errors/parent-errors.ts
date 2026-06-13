import type { FlashToast } from "@/lib/messages/flash-types";

export const PARENT_GENERIC: FlashToast = {
  type: "error",
  title: "Un petit souci technique",
  description:
    "Réessayez dans un instant. Si le problème continue, contactez l'ASBL.",
};

export const PARENT_ERROR_MESSAGES: Record<string, FlashToast> = {
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
      "La demande n'a pas pu être enregistrée. Réessayez dans un instant ou contactez l'ASBL.",
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
  "bank-not-configured": {
    type: "error",
    title: "Virement indisponible",
    description: "L'ASBL n'a pas encore configuré son IBAN. Contactez l'équipe.",
  },
  "proof-missing": {
    type: "error",
    title: "Fichier manquant",
    description: "Sélectionnez une preuve de virement (PDF, JPEG ou PNG).",
  },
  "proof_too_large": {
    type: "error",
    title: "Fichier trop volumineux",
    description: "La preuve ne doit pas dépasser 5 Mo.",
  },
  "proof_type": {
    type: "error",
    title: "Format non accepté",
    description: "Formats acceptés : PDF, JPEG ou PNG.",
  },
  "proof-upload": {
    type: "error",
    title: "Envoi impossible",
    description: "La preuve n'a pas pu être téléversée. Réessayez.",
  },
  "proof-save": {
    type: "error",
    title: "Enregistrement impossible",
    description: "Réessayez ou contactez l'ASBL si le problème persiste.",
  },
};
