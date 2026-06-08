import type { ParentChildLink } from "@/lib/data/parent";
import type { Membership } from "@/lib/data/memberships";

export type SerenityStepState = "done" | "current" | "waiting" | "locked";

export type SerenityStep = {
  id: string;
  title: string;
  description: string;
  state: SerenityStepState;
  actionLabel?: string;
  actionHref?: string;
};

export type ChildSerenityView = {
  childId: string;
  firstName: string;
  lastName: string;
  steps: SerenityStep[];
  reassurance: string;
  activityCount: number;
  isFullyActive: boolean;
};

function step(
  partial: SerenityStep & { id: string }
): SerenityStep {
  return partial;
}

export function buildChildSerenityView(input: {
  link: ParentChildLink;
  membership: Membership | null;
  activityCount: number;
}): ChildSerenityView {
  const { link, membership, activityCount } = input;
  const firstName = link.first_name;
  const steps: SerenityStep[] = [];

  steps.push(
    step({
      id: "enrollment",
      title: "Inscription enregistrée",
      description: `La fiche de ${firstName} est bien reçue par l'ASBL.`,
      state: "done",
    })
  );

  const needsPayment =
    membership?.status === "AWAITING_PAYMENT" && (membership.fee_cents ?? 0) > 0;
  const legacyNeedsPayment = link.enrollment_status === "EN_ATTENTE_PAIEMENT";

  if (needsPayment || legacyNeedsPayment) {
    steps.push(
      step({
        id: "fee",
        title: "Cotisation ASBL",
        description: "Finalisez la cotisation annuelle quand vous le souhaitez.",
        state: "current",
        actionLabel: "Finaliser la cotisation",
        actionHref: `/espace-parents/paiement/${link.child_id}`,
      })
    );
  } else if (membership?.fee_cents === 0 || membership?.status === "ACTIVE") {
    steps.push(
      step({
        id: "fee",
        title: "Cotisation ASBL",
        description:
          membership?.fee_cents === 0
            ? "Aucune cotisation requise cette année."
            : "Cotisation enregistrée.",
        state: "done",
      })
    );
  } else if (membership?.status === "AWAITING_ASBL") {
    steps.push(
      step({
        id: "fee",
        title: "Cotisation ASBL",
        description: "Cotisation reçue ou non requise.",
        state: "done",
      })
    );
  } else {
    steps.push(
      step({
        id: "fee",
        title: "Cotisation ASBL",
        description: "Pas de cotisation en attente.",
        state: "done",
      })
    );
  }

  const membershipActive = membership?.status === "ACTIVE";
  const membershipRejected =
    membership?.status === "REJECTED" || membership?.status === "CANCELLED";
  const waitingAsblMembership = membership?.status === "AWAITING_ASBL";

  let isAsblValidated = membershipActive;
  if (!membership) {
    isAsblValidated =
      link.verified &&
      (link.enrollment_status === "VALIDE" || link.enrollment_status === null);
  } else if (!membershipActive && !waitingAsblMembership && link.verified) {
    isAsblValidated = link.enrollment_status === "VALIDE";
  }

  if (membershipRejected || link.enrollment_status === "REFUSE") {
    steps.push(
      step({
        id: "validation",
        title: "Validation ASBL",
        description: "Contactez l'ASBL pour plus d'informations.",
        state: "waiting",
      })
    );
  } else if (isAsblValidated) {
    steps.push(
      step({
        id: "validation",
        title: "Validation ASBL",
        description: `${firstName} est membre actif de l'ASBL.`,
        state: "done",
      })
    );
  } else if (needsPayment || legacyNeedsPayment) {
    steps.push(
      step({
        id: "validation",
        title: "Validation ASBL",
        description: "Disponible après la cotisation (si applicable).",
        state: "locked",
      })
    );
  } else {
    steps.push(
      step({
        id: "validation",
        title: "Validation ASBL",
        description: "L'équipe ASBL examine le dossier — patience, c'est en cours.",
        state: "current",
      })
    );
  }

  const canBrowseActivities = link.verified;

  if (!canBrowseActivities) {
    steps.push(
      step({
        id: "activities",
        title: "Activités",
        description: "Vous pourrez inscrire " + firstName + " aux activités après validation.",
        state: "locked",
      })
    );
  } else if (activityCount === 0) {
    steps.push(
      step({
        id: "activities",
        title: "Activités",
        description: "Découvrez les activités ouvertes aux parents.",
        state: "current",
        actionLabel: "Voir les activités",
        actionHref: "/espace-parents/activites",
      })
    );
  } else {
    steps.push(
      step({
        id: "activities",
        title: "Activités",
        description:
          activityCount === 1
            ? `${firstName} est inscrit(e) à 1 activité.`
            : `${firstName} est inscrit(e) à ${activityCount} activités.`,
        state: "done",
        actionLabel: "Voir les activités",
        actionHref: "/espace-parents/activites",
      })
    );
  }

  const reassurance = buildReassurance(firstName, {
    needsPayment: needsPayment || legacyNeedsPayment,
    isAsblValidated,
    activityCount,
    waitingAsbl: !isAsblValidated && !needsPayment && !legacyNeedsPayment,
    rejected: membershipRejected || link.enrollment_status === "REFUSE",
  });

  return {
    childId: link.child_id,
    firstName,
    lastName: link.last_name,
    steps,
    reassurance,
    activityCount,
    isFullyActive: isAsblValidated && (activityCount > 0 || steps.find(s => s.id === "activities")?.state === "current"),
  };
}

function buildReassurance(
  firstName: string,
  ctx: {
    needsPayment: boolean;
    isAsblValidated: boolean;
    activityCount: number;
    waitingAsbl: boolean;
    rejected: boolean;
  }
): string {
  if (ctx.rejected) {
    return `Pour ${firstName}, contactez l'ASBL si vous avez des questions.`;
  }
  if (ctx.needsPayment) {
    return `${firstName} — cotisation à finaliser quand vous voulez.`;
  }
  if (ctx.waitingAsbl) {
    return `${firstName} est inscrit(e). Validation en cours par l'équipe.`;
  }
  if (ctx.isAsblValidated && ctx.activityCount > 0) {
    return `Tout est en ordre pour ${firstName}. Inscrit(e) à ${ctx.activityCount} activité${ctx.activityCount > 1 ? "s" : ""}.`;
  }
  if (ctx.isAsblValidated) {
    return `${firstName} est validé(e) par l'ASBL. Explorez les activités disponibles quand vous voulez.`;
  }
  return `${firstName} — voir les étapes ci-dessous.`;
}
