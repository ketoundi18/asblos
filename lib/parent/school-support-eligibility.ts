import type { Membership } from "@/lib/data/memberships";

export type SchoolSupportEnrollmentEligibility =
  | { allowed: true; membership: Membership }
  | {
      allowed: false;
      reason:
        | "no_membership"
        | "base_plan"
        | "awaiting_payment"
        | "choose_days"
        | "already_enrolled"
        | "not_active";
      message: string;
      actionHref?: string;
      actionLabel?: string;
    };

export function resolveSchoolSupportEnrollmentEligibility(
  membership: Membership | null,
  hasProgramEnrollment: boolean
): SchoolSupportEnrollmentEligibility {
  if (!membership) {
    return {
      allowed: false,
      reason: "no_membership",
      message:
        "Votre adhésion est en cours de synchronisation. Rechargez la page ou contactez l'ASBL.",
    };
  }

  if (membership.plan === "BASE") {
    return {
      allowed: false,
      reason: "base_plan",
      message:
        "Activez la formule soutien scolaire pour indiquer les jours qui conviennent à votre enfant.",
    };
  }

  if (membership.status === "AWAITING_PAYMENT" && membership.fee_cents > 0) {
    return {
      allowed: false,
      reason: "awaiting_payment",
      message:
        "Finalisez d'abord la cotisation soutien scolaire, puis vous pourrez choisir les jours.",
      actionHref: `/espace-parents/paiement/${membership.child_id}`,
      actionLabel: "Finaliser la cotisation",
    };
  }

  if (hasProgramEnrollment) {
    return {
      allowed: false,
      reason: "already_enrolled",
      message:
        "Les jours de soutien scolaire sont enregistrés. L'ASBL valide le planning avec vous.",
    };
  }

  if (
    membership.plan === "SCHOOL_SUPPORT" &&
    (membership.status === "AWAITING_ASBL" || membership.status === "ACTIVE")
  ) {
    return {
      allowed: false,
      reason: "choose_days",
      message:
        "Indiquez les jours qui conviennent le mieux à votre enfant — ce n'est pas obligatoire tout de suite.",
      actionHref: `/espace-parents/choisir-creneaux/${membership.child_id}`,
      actionLabel: "Choisir les jours",
    };
  }

  if (membership.status !== "ACTIVE") {
    return {
      allowed: false,
      reason: "not_active",
      message: "L'adhésion n'est pas active pour le moment. Contactez l'ASBL si besoin.",
    };
  }

  return { allowed: true, membership };
}
