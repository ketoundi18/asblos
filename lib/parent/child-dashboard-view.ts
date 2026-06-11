import type { ParentChildLink } from "@/lib/data/parent";
import type { ChildEnrollmentState } from "@/lib/enrollment/child-enrollment-state";
import { resolveParentDashboardAsblValidated } from "@/lib/enrollment/child-enrollment-state";

export type DashboardStepState = "done" | "current" | "waiting" | "locked";

export type DashboardStep = {
  id: string;
  title: string;
  description: string;
  state: DashboardStepState;
  actionLabel?: string;
  actionHref?: string;
};

export type ChildDashboardView = {
  childId: string;
  firstName: string;
  lastName: string;
  steps: DashboardStep[];
  reassurance: string;
  activityCount: number;
  isFullyActive: boolean;
};

function step(
  partial: DashboardStep & { id: string }
): DashboardStep {
  return partial;
}

export function buildChildDashboardView(input: {
  link: ParentChildLink;
  state: ChildEnrollmentState;
  activityCount: number;
}): ChildDashboardView {
  const { link, state, activityCount } = input;
  const firstName = link.first_name;
  const membership = state.layer_b;
  const derived = state.derived;
  const steps: DashboardStep[] = [];

  steps.push(
    step({
      id: "enrollment",
      title: "Inscription enregistrée",
      description: `La fiche de ${firstName} est bien reçue par l'ASBL.`,
      state: "done",
    })
  );

  const needsPayment = derived.needs_payment;

  if (needsPayment) {
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

  const isAsblValidated = resolveParentDashboardAsblValidated(state, link.verified);
  const waitingAsblMembership = membership?.status === "AWAITING_ASBL";

  if (derived.is_rejected) {
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
  } else if (needsPayment) {
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

  const wantsSchoolSupport = membership?.plan === "SCHOOL_SUPPORT";
  const paymentDone = !needsPayment;

  if (wantsSchoolSupport && paymentDone && !derived.has_program_enrollment) {
    steps.push(
      step({
        id: "school_support_days",
        title: "Jours de soutien scolaire",
        description:
          "Indiquez les jours qui conviennent à " +
          firstName +
          " — quand vous le souhaitez, l'ASBL adaptera le planning.",
        state: "current",
        actionLabel: "Choisir les jours",
        actionHref: `/espace-parents/choisir-creneaux/${link.child_id}`,
      })
    );
  } else if (wantsSchoolSupport && derived.has_program_enrollment) {
    steps.push(
      step({
        id: "school_support_days",
        title: "Jours de soutien scolaire",
        description: "Vos jours préférés sont enregistrés — l'ASBL valide le planning.",
        state: "done",
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
    needsPayment,
    isAsblValidated,
    activityCount,
    waitingAsbl: !isAsblValidated && !needsPayment && !!waitingAsblMembership,
    rejected: derived.is_rejected,
  });

  return {
    childId: link.child_id,
    firstName,
    lastName: link.last_name,
    steps,
    reassurance,
    activityCount,
    isFullyActive:
      isAsblValidated &&
      (activityCount > 0 || steps.find((s) => s.id === "activities")?.state === "current"),
  };
}

/** Vue minimale quand la RPC d'état n'est pas encore disponible (ex. inscription fraîche). */
export function buildChildDashboardFallbackView(input: {
  link: ParentChildLink;
  activityCount: number;
}): ChildDashboardView {
  const { link, activityCount } = input;
  const firstName = link.first_name;

  return {
    childId: link.child_id,
    firstName,
    lastName: link.last_name,
    steps: [
      step({
        id: "enrollment",
        title: "Inscription enregistrée",
        description: `La fiche de ${firstName} est bien reçue par l'ASBL.`,
        state: "done",
      }),
      step({
        id: "validation",
        title: "Validation ASBL",
        description: "L'équipe ASBL examine le dossier — patience, c'est en cours.",
        state: "current",
      }),
    ],
    reassurance: `${firstName} — voir les étapes ci-dessous.`,
    activityCount,
    isFullyActive: false,
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
