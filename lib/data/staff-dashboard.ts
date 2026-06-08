import { createClient } from "@/lib/supabase/server";
import { getParentLinksForAdmin } from "@/lib/data/parent-admin";
import { isReadyToValidate, isWaitingPayment } from "@/lib/data/command-center";
import { addDaysToIso, getLocalTodayISO } from "@/lib/date-utils";
import { formatActivityTime } from "@/types/activity";
import type { UserRole } from "@/lib/auth/roles";
import { canManageUsers, canRecordPayment, isStaffLimitedAccess } from "@/lib/auth/permissions";

export type StaffDashboardAction = {
  id: string;
  title: string;
  description: string;
  count: number;
  href: string;
  urgent: boolean;
};

export type StaffTodayActivity = {
  id: string;
  title: string;
  timeLabel: string;
  registrationCount: number;
};

export type StaffDashboardData = {
  actions: StaffDashboardAction[];
  todayActivities: StaffTodayActivity[];
  loadError: string | null;
};

async function getTodayActivities(): Promise<StaffTodayActivity[]> {
  const supabase = await createClient();
  const today = getLocalTodayISO();

  const { data: rows, error } = await supabase
    .from("activities")
    .select("id, title, start_time, end_time")
    .eq("activity_date", today)
    .in("status", ["PLANIFIEE", "EN_COURS"])
    .is("deleted_at", null)
    .order("start_time", { ascending: true, nullsFirst: false });

  if (error || !rows?.length) return [];

  const activities = rows as {
    id: string;
    title: string;
    start_time: string | null;
    end_time: string | null;
  }[];

  const ids = activities.map((a) => a.id);
  const { data: regs } = await supabase
    .from("activity_registrations")
    .select("activity_id")
    .in("activity_id", ids)
    .is("cancelled_at", null);

  const countByActivity = new Map<string, number>();
  for (const r of (regs ?? []) as { activity_id: string }[]) {
    countByActivity.set(r.activity_id, (countByActivity.get(r.activity_id) ?? 0) + 1);
  }

  return activities.map((a) => {
    const start = formatActivityTime(a.start_time);
    const end = formatActivityTime(a.end_time);
    const timeLabel = start && end ? `${start} – ${end}` : start || "Horaire à confirmer";
    return {
      id: a.id,
      title: a.title,
      timeLabel,
      registrationCount: countByActivity.get(a.id) ?? 0,
    };
  });
}

async function getWeekActivityCount(): Promise<number> {
  const supabase = await createClient();
  const today = getLocalTodayISO();
  const weekEnd = addDaysToIso(today, 7);

  const { count, error } = await supabase
    .from("activities")
    .select("id", { count: "exact", head: true })
    .gte("activity_date", today)
    .lte("activity_date", weekEnd)
    .in("status", ["PLANIFIEE", "EN_COURS"])
    .is("deleted_at", null);

  if (error) return 0;
  return count ?? 0;
}

async function getPendingPaymentsCount(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("status", "PENDING");

  if (error) return 0;
  return count ?? 0;
}

async function getDeferredParticipationsCount(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("activity_registrations")
    .select("id", { count: "exact", head: true })
    .in("payment_status", ["DEFERRED", "PENDING"])
    .is("cancelled_at", null);

  if (error?.message?.includes("payment_status")) return 0;
  if (error) return 0;
  return count ?? 0;
}

export async function getStaffDashboard(role: UserRole): Promise<StaffDashboardData> {
  const todayActivities = await getTodayActivities();
  const actions: StaffDashboardAction[] = [];
  let loadError: string | null = null;

  if (isStaffLimitedAccess(role)) {
    if (todayActivities.length > 0) {
      actions.push({
        id: "today",
        title: "Présences du jour",
        description: "Marquez qui est présent ou absent",
        count: todayActivities.length,
        href: `/activites/${todayActivities[0].id}/terrain`,
        urgent: true,
      });
    } else {
      actions.push({
        id: "activities",
        title: "Calendrier activités",
        description: "Voir les prochaines activités planifiées",
        count: 0,
        href: "/activites",
        urgent: false,
      });
    }
    return { actions, todayActivities, loadError: null };
  }

  const [{ links, loadError: linksError }, weekCount, pendingPayments, deferredCount] =
    await Promise.all([
      getParentLinksForAdmin(),
      getWeekActivityCount(),
      canRecordPayment(role) ? getPendingPaymentsCount() : Promise.resolve(0),
      getDeferredParticipationsCount(),
    ]);

  loadError = linksError;

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

  if (weekCount > 0) {
    actions.push({
      id: "week",
      title: "Cette semaine",
      description: "Activités planifiées dans les 7 prochains jours",
      count: weekCount,
      href: "/activites",
      urgent: false,
    });
  }

  if (canRecordPayment(role) && pendingPayments > 0) {
    actions.push({
      id: "payments",
      title: "Paiements en cours",
      description: "Transactions à vérifier ou finaliser",
      count: pendingPayments,
      href: "/paiements",
      urgent: false,
    });
  }

  if (deferredCount > 0) {
    actions.push({
      id: "deferred",
      title: "Participations reportées",
      description: "Familles inscrites — règlement à accompagner avec bienveillance",
      count: deferredCount,
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

  return { actions, todayActivities, loadError };
}
