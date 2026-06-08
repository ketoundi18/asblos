import type { Membership } from "@/lib/data/memberships";

export type SchoolSupportEnrollmentEligibility =
  | { allowed: true; membership: Membership }
  | {
      allowed: false;
      reason: "no_membership" | "base_plan" | "awaiting_payment" | "awaiting_asbl" | "not_active";
      message: string;
      actionHref?: string;
      actionLabel?: string;
    };

export function resolveSchoolSupportEnrollmentEligibility(
  membership: Membership | null
): SchoolSupportEnrollmentEligibility {
  if (!membership) {
    return {
      allowed: false,
      reason: "no_membership",
      message:
        "Votre adhésion est en cours de synchronisation. Rechargez la page (Cmd+Shift+R) ou contactez l'ASBL.",
    };
  }

  if (membership.plan === "BASE") {
    return {
      allowed: false,
      reason: "base_plan",
      message:
        "Pour le soutien scolaire, activez la cotisation annuelle ci-dessous — sans pression.",
    };
  }

  if (membership.status === "AWAITING_PAYMENT" && membership.fee_cents > 0) {
    return {
      allowed: false,
      reason: "awaiting_payment",
      message:
        "La cotisation soutien scolaire n'est pas encore réglée. Finalisez-la quand vous le souhaitez — sans pression.",
      actionHref: `/espace-parents/paiement/${membership.child_id}`,
      actionLabel: "Voir la cotisation",
    };
  }

  if (membership.status === "AWAITING_ASBL") {
    return {
      allowed: false,
      reason: "awaiting_asbl",
      message:
        "L'ASBL examine encore le dossier. Dès validation, vous pourrez inscrire au soutien scolaire.",
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
