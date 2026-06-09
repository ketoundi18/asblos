import type { AdminParentLink } from "@/lib/data/parent-admin";
import { isReadyToValidate, isWaitingPayment } from "@/lib/data/command-center";
import type { UserRole } from "@/lib/auth/roles";
import { canManageUsers, canRecordPayment } from "@/lib/auth/permissions";
import type { StaffDashboardAction, StaffTodayActivity } from "@/lib/data/staff-dashboard/types";

type AdminDashboardCounts = {
  weekCount: number;
  pendingPayments: number;
  deferredCount: number;
};

export function buildAdminDashboardActions(
  role: UserRole,
  links: AdminParentLink[],
  counts: AdminDashboardCounts,
  todayActivities: StaffTodayActivity[]
): StaffDashboardAction[] {
  const actions: StaffDashboardAction[] = [];
  const readyToValidate = links.filter(isReadyToValidate).length;
  const waitingPayment = links.filter(isWaitingPayment).length;

  if (canManageUsers(role) && readyToValidate > 0) {
    actions.push({
      id: "validate",
      title: "Parents à valider",
      description: "Dossiers prêts — un clic pour valider le lien",
      count: readyToValidate,
      href: "/",
      urgent: true,
    });
  }

  if (canManageUsers(role) && waitingPayment > 0) {
    actions.push({
      id: "waiting-payment",
      title: "En attente de paiement",
      description: "Parents qui n'ont pas encore payé la cotisation",
      count: waitingPayment,
      href: "/administration",
      urgent: false,
    });
  }

  if (todayActivities.length > 0) {
    actions.push({
      id: "today",
      title: "Activités aujourd'hui",
      description: "Présences et encadrement sur le terrain",
      count: todayActivities.length,
      href: `/activites/${todayActivities[0].id}/terrain`,
      urgent: todayActivities.length > 0,
    });
  }

  if (counts.weekCount > 0) {
    actions.push({
      id: "week",
      title: "Cette semaine",
      description: "Activités planifiées dans les 7 prochains jours",
      count: counts.weekCount,
      href: "/activites",
      urgent: false,
    });
  }

  if (canRecordPayment(role) && counts.pendingPayments > 0) {
    actions.push({
      id: "payments",
      title: "Paiements en cours",
      description: "Transactions à vérifier ou finaliser",
      count: counts.pendingPayments,
      href: "/paiements",
      urgent: false,
    });
  }

  if (counts.deferredCount > 0) {
    actions.push({
      id: "deferred",
      title: "Participations reportées",
      description: "Familles inscrites — règlement à accompagner avec bienveillance",
      count: counts.deferredCount,
      href: "/",
      urgent: false,
    });
  }

  if (actions.length === 0) {
    actions.push({
      id: "all-clear",
      title: "Tout est à jour",
      description: "Aucune action urgente pour l'instant",
      count: 0,
      href: "/activites",
      urgent: false,
    });
  }

  return actions;
}
