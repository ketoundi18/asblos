import type { FlashToast } from "@/lib/messages/flash-types";
import { staffDetail } from "@/lib/messages/flash-errors/staff-detail";

export function buildStaffErrorMessages(
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
    "admin-only": {
      type: "info",
      title: "Réservé à l'administrateur",
      description:
        "La page Familles est réservée aux admins. Configure l'IBAN et valide les preuves depuis Paiements.",
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
      title: "Fonctionnalité pas encore activée",
      description: staffDetail(
        detail,
        "Une configuration base de données est nécessaire sur cette instance. Contacte la personne qui gère AsblOS."
      ),
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
    "service-open": {
      type: "error",
      title: "Service déjà en cours",
      description: "Termine d'abord le service en cours avant d'en commencer un nouveau.",
    },
    "service-none": {
      type: "error",
      title: "Aucun service en cours",
      description: "Commence ton service avant de le terminer.",
    },
    "staff-self-toggle": {
      type: "error",
      title: "Action impossible",
      description: "Tu ne peux pas désactiver ton propre compte.",
    },
    "staff-not-found": {
      type: "error",
      title: "Membre introuvable",
      description: "Recharge la page et réessaie.",
    },
    "staff-admin-protected": {
      type: "error",
      title: "Compte protégé",
      description: "Les comptes administrateur ne se désactivent pas depuis ici.",
    },
    "contract-member": {
      type: "error",
      title: "Membre introuvable",
      description: "Recharge la page et réessaie.",
    },
    "contract-save": {
      type: "error",
      title: "Objectif non enregistré",
      description: "Réessaie ou vérifie les migrations 031–037 dans Supabase.",
    },
    "contract-migration": {
      type: "error",
      title: "Objectif non enregistré",
      description:
        "Applique 037_upsert_staff_contract_rpc.sql dans Supabase SQL Editor, puis réessaie.",
    },
    "proof-not-submitted": {
      type: "error",
      title: "Preuve absente",
      description: "Ce paiement n'a pas de preuve en attente de validation.",
    },
    "confirm-payment": {
      type: "error",
      title: "Confirmation impossible",
      description: staffDetail(detail, "Réessaie ou vérifie la migration 048."),
    },
    "reject-payment": {
      type: "error",
      title: "Refus impossible",
      description: staffDetail(detail, "Réessaie dans un instant."),
    },
    "membership-sync": {
      type: "error",
      title: "Cotisation non synchronisée",
      description: "Le paiement est confirmé mais la cotisation n'a pas pu avancer.",
    },
    "activity-sync": {
      type: "error",
      title: "Activité non synchronisée",
      description: "Le paiement est confirmé mais l'inscription activité n'a pas été mise à jour.",
    },
    "bank-iban": {
      type: "error",
      title: "IBAN invalide",
      description: "Vérifie le format belge (ex. BE68…).",
    },
    "bank-holder": {
      type: "error",
      title: "Titulaire manquant",
      description: "Indique le nom du titulaire du compte avec l'IBAN.",
    },
    "bank-save": {
      type: "error",
      title: "IBAN non enregistré",
      description: staffDetail(detail, "Applique 048 puis 049 (virement) dans Supabase."),
    },
  };
}
