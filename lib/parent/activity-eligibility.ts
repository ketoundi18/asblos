import type { Membership } from "@/lib/data/memberships";
import type { ChildEnrollmentState } from "@/lib/enrollment/child-enrollment-state";
import { membershipFromEnrollmentState } from "@/lib/enrollment/child-enrollment-state";

export type ActivityRegistrationBlockReason =
  | "awaiting_payment"
  | "awaiting_asbl"
  | "rejected"
  | "legacy_pending";

export type ActivityRegistrationEligibility =
  | { allowed: true }
  | {
      allowed: false;
      reason: ActivityRegistrationBlockReason;
      message: string;
      actionHref?: string;
      actionLabel?: string;
    };

/** Règle métier : inscription activité si cotisation ACTIVE. */
export function resolveActivityRegistrationEligibility(
  membership: Membership | null
): ActivityRegistrationEligibility {
  if (membership) {
    if (membership.status === "ACTIVE") {
      return { allowed: true };
    }

    if (membership.status === "AWAITING_PAYMENT" && membership.fee_cents > 0) {
      const isSchoolSupport = membership.plan === "SCHOOL_SUPPORT";
      return {
        allowed: false,
        reason: "awaiting_payment",
        message: isSchoolSupport
          ? "La cotisation soutien scolaire n'est pas encore réglée. Vous pouvez la finaliser quand vous le souhaitez — sans pression."
          : "L'ASBL examine encore le dossier de votre enfant.",
        actionHref: isSchoolSupport
          ? `/espace-parents/paiement/${membership.child_id}`
          : undefined,
        actionLabel: isSchoolSupport ? "Voir la cotisation" : undefined,
      };
    }

    if (membership.status === "AWAITING_ASBL") {
      return {
        allowed: false,
        reason: "awaiting_asbl",
        message:
          "L'ASBL examine encore le dossier de votre enfant. Dès que c'est validé, vous pourrez inscrire aux activités.",
      };
    }

    if (membership.status === "AWAITING_PAYMENT" && membership.fee_cents <= 0) {
      return {
        allowed: false,
        reason: "awaiting_asbl",
        message:
          "L'ASBL examine encore le dossier de votre enfant. Dès que c'est validé, vous pourrez inscrire aux activités.",
      };
    }

    if (membership.status === "REJECTED" || membership.status === "CANCELLED") {
      return {
        allowed: false,
        reason: "rejected",
        message:
          "L'inscription de votre enfant n'est pas active pour le moment. Contactez l'ASBL si vous avez des questions.",
      };
    }
  }

  return {
    allowed: false,
    reason: "legacy_pending",
    message:
      "L'ASBL doit encore valider le dossier de votre enfant avant l'inscription aux activités.",
  };
}

export function resolveActivityRegistrationEligibilityFromState(
  state: ChildEnrollmentState
): ActivityRegistrationEligibility {
  const membershipResult = resolveActivityRegistrationEligibility(
    membershipFromEnrollmentState(state)
  );
  if (membershipResult.allowed) {
    return membershipResult;
  }
  if (state.derived.is_asbl_validated) {
    return { allowed: true };
  }
  return membershipResult;
}
