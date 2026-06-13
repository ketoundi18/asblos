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
  "bank-updated": {
    type: "success",
    title: "Coordonnées bancaires enregistrées",
    description: "Les parents verront cet IBAN pour leurs virements.",
  },
  "proof-submitted": {
    type: "success",
    title: "Preuve envoyée",
    description: "Merci ! L'ASBL confirmera votre paiement sous 48 h ouvrées.",
  },
  "proof-pending": {
    type: "success",
    title: "Preuve déjà reçue",
    description: "Votre preuve est en cours de validation par l'ASBL.",
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
  created: {
    type: "success",
    title: "Programme créé",
    description: "Ajoute des créneaux, puis publie le programme aux parents.",
  },
  "slot-added": {
    type: "success",
    title: "Créneau ajouté",
    description: "Le créneau est enregistré pour ce programme.",
  },
  updated: {
    type: "success",
    title: "Programme mis à jour",
    description: "Les paramètres du programme sont enregistrés.",
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
  "service-started": {
    type: "success",
    title: "Service commencé",
    description: "Bon courage ! N'oublie pas de terminer en fin de journée.",
  },
  "service-ended": {
    type: "success",
    title: "Service terminé",
    description: "Tes heures sont enregistrées. Merci pour aujourd'hui.",
  },
  "staff-created": {
    type: "success",
    title: "Compte créé",
    description:
      "Le membre peut se connecter tout de suite. Communique-lui le mot de passe temporaire — il pourra le changer dans Mon compte.",
  },
  "staff-activated": {
    type: "success",
    title: "Compte réactivé",
    description: "La personne peut à nouveau se connecter.",
  },
  "staff-deactivated": {
    type: "success",
    title: "Compte désactivé",
    description: "La personne ne peut plus se connecter.",
  },
  "password-changed": {
    type: "success",
    title: "Mot de passe modifié",
    description: "Ton nouveau mot de passe est actif. Garde-le pour toi.",
  },
  "password-reset": {
    type: "success",
    title: "Mot de passe réinitialisé",
    description: "Tu peux te connecter avec ton nouveau mot de passe.",
  },
  "contract-created": {
    type: "success",
    title: "Objectif défini",
    description: "L'objectif horaire est enregistré. Il sera visible dès la prochaine connexion.",
  },
  "contract-updated": {
    type: "success",
    title: "Objectif mis à jour",
    description: "L'ancien objectif est clôturé et le nouveau est actif.",
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
  "payment-confirmed": {
    type: "success",
    title: "Paiement confirmé",
    description: "La cotisation ou l'activité est marquée comme payée.",
  },
  "payment-rejected": {
    type: "success",
    title: "Preuve refusée",
    description: "Le parent peut renvoyer une nouvelle preuve.",
  },
  "payment-already-paid": {
    type: "success",
    title: "Déjà payé",
    description: "Ce paiement était déjà confirmé.",
  },
  "bank-updated": {
    type: "success",
    title: "IBAN enregistré",
    description: "Les coordonnées bancaires sont à jour.",
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
