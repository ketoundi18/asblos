import type { FlashAudience, FlashToast } from "@/lib/messages/flash-types";

const SUCCESS_MESSAGES: Record<string, FlashToast> = {
  inscription: {
    type: "success",
    title: "Inscription envoyée",
    description:
      "L'ASBL va valider le dossier sous peu. Rien d'autre à faire pour l'instant.",
  },
  paiement: {
    type: "success",
    title: "Paiement enregistré",
    description: "Merci ! L'ASBL va confirmer l'inscription prochainement.",
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
    description:
      "L'ASBL va valider le dossier. Vous pourrez ensuite inscrire votre enfant au soutien.",
  },
  upgrade: {
    type: "success",
    title: "Soutien scolaire activé",
    description:
      "Finalisez la cotisation pour activer le soutien scolaire de votre enfant.",
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
  anonymized: {
    type: "success",
    title: "Fiche anonymisée",
    description: "Les données personnelles de l'enfant ont été effacées (RGPD).",
  },
};

const STAFF_SUCCESS_OVERRIDES: Partial<Record<string, FlashToast>> = {
  inscription: {
    type: "success",
    title: "Inscription envoyée",
    description: "La fiche enfant a été enregistrée.",
  },
  paiement: {
    type: "success",
    title: "Paiement enregistré",
    description: "Le paiement a bien été pris en compte.",
  },
};

export function resolveSuccessFlashToast(
  code: string,
  payment: string | null | undefined,
  audience: FlashAudience
): FlashToast {
  if (code === "inscription" && payment === "pending" && audience === "parent") {
    return {
      type: "success",
      title: "Inscription confirmée",
      description:
        "Votre enfant participe à l'activité. Vous pourrez régler la participation quand vous le souhaitez.",
    };
  }

  const base = SUCCESS_MESSAGES[code];
  if (audience === "staff" && STAFF_SUCCESS_OVERRIDES[code]) {
    return STAFF_SUCCESS_OVERRIDES[code]!;
  }

  if (base) return base;

  return {
    type: "success",
    title: "C'est fait",
    description: "L'action s'est bien déroulée.",
  };
}
