import { createClient } from "@/lib/supabase/server";
import { getParentLinksForAdmin, type AdminParentLink } from "@/lib/data/parent-admin";
import { getSchoolSupportAdminQueue } from "@/lib/data/school-support-admin";
import { addDaysToIso, getLocalTodayISO } from "@/lib/date-utils";
import { formatActivityDate, formatActivityTime } from "@/types/activity";
import type { UserRole } from "@/lib/auth/roles";
import {
  canManageUsers,
  canRecordPayment,
  isStaffLimitedAccess,
} from "@/lib/auth/permissions";

export type CommandPriority = "urgent" | "attention" | "info";

export type CommandItem = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  priority: CommandPriority;
  actionLabel: string;
  /** Action directe depuis Ma journée (sans changer de page) */
  quickAction?: "validate_parent" | "confirm_school_support";
  quickActionId?: string;
};

export type CommandSection = {
  id: string;
  title: string;
  description: string;
  items: CommandItem[];
  priority: CommandPriority;
};

export type CommandCenterData = {
  /** Dossiers urgents ou à suivre (actions requises) */
  actionSections: CommandSection[];
  /** Infos utiles sans action immédiate (ex. activités de demain) */
  infoSections: CommandSection[];
  urgentCount: number;
  attentionCount: number;
  /** Aucune action urgente ni à suivre */
  allClear: boolean;
  loadError: string | null;
};

export function isReadyToValidate(link: AdminParentLink): boolean {
  if (link.verified) return false;
  if (
    link.membership_status === "AWAITING_PAYMENT" &&
    (link.membership_fee_cents ?? 0) > 0
  ) {
    return false;
  }
  if (link.child_enrollment_status === "EN_ATTENTE_PAIEMENT") {
    return false;
  }
  return true;
}

export function isWaitingPayment(link: AdminParentLink): boolean {
  if (link.verified) return false;
  if (
    link.membership_status === "AWAITING_PAYMENT" &&
    (link.membership_fee_cents ?? 0) > 0
  ) {
    return true;
  }
  return link.child_enrollment_status === "EN_ATTENTE_PAIEMENT";
}

type ActivityRow = {
  id: string;
  title: string;
  activity_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
};

async function getActivitiesForDate(date: string): Promise<ActivityRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("activities")
    .select("id, title, activity_date, start_time, end_time, location")
    .eq("activity_date", date)
    .in("status", ["PLANIFIEE", "EN_COURS"])
    .is("deleted_at", null)
    .order("start_time", { ascending: true, nullsFirst: false });

  return (data ?? []) as ActivityRow[];
}

function activitySubtitle(a: ActivityRow, registrationCount: number): string {
  const start = formatActivityTime(a.start_time);
  const end = formatActivityTime(a.end_time);
  const time = start && end ? `${start} – ${end}` : start || "Horaire à confirmer";
  const place = a.location ? ` · ${a.location}` : "";
  return `${time} · ${registrationCount} inscrit${registrationCount !== 1 ? "s" : ""}${place}`;
}

async function buildActivitySection(
  id: string,
  title: string,
  description: string,
  activities: ActivityRow[],
  priority: CommandPriority,
  useTerrainLink: boolean
): Promise<CommandSection> {
  if (activities.length === 0) {
    return { id, title, description, items: [], priority };
  }

  const supabase = await createClient();
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

  const items: CommandItem[] = activities.map((a) => ({
    id: a.id,
    title: a.title,
    subtitle: activitySubtitle(a, countByActivity.get(a.id) ?? 0),
    href: useTerrainLink
      ? `/activites/${a.id}/terrain`
      : `/activites/${a.id}`,
    priority,
    actionLabel: useTerrainLink ? "Marquer les présences" : "Voir",
  }));

  return { id, title, description, items, priority };
}

async function getDeferredParticipationItems(): Promise<CommandItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_registrations")
    .select(
      `
      id,
      payment_status,
      activity_id,
      activities ( title, activity_date ),
      children ( first_name, last_name )
    `
    )
    .in("payment_status", ["DEFERRED", "PENDING"])
    .is("cancelled_at", null)
    .limit(20);

  if (error?.message?.includes("payment_status") || error || !data?.length) {
    return [];
  }

  type Row = {
    id: string;
    payment_status: string;
    activity_id: string;
    activities: { title: string; activity_date: string } | null;
    children: { first_name: string; last_name: string } | null;
  };

  return ((data ?? []) as Row[])
    .filter((r) => r.activities && r.children)
    .map((r) => ({
      id: r.id,
      title: `${r.children!.first_name} ${r.children!.last_name}`,
      subtitle: `${r.activities!.title} · ${formatActivityDate(r.activities!.activity_date)} · ${
        r.payment_status === "DEFERRED" ? "Report demandé" : "Paiement en attente"
      }`,
      href: `/activites/${r.activity_id}`,
      priority: "attention" as const,
      actionLabel: "Voir activité",
    }));
}

async function getPendingPaymentItems(): Promise<CommandItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("id, amount_cents, created_at, child_id, parent_id")
    .eq("status", "PENDING")
    .order("created_at", { ascending: false })
    .limit(15);

  if (error || !data?.length) return [];

  const rows = data as {
    id: string;
    amount_cents: number;
    child_id: string;
    parent_id: string;
  }[];

  const childIds = [...new Set(rows.map((r) => r.child_id))];
  const parentIds = [...new Set(rows.map((r) => r.parent_id))];

  const [{ data: children }, { data: profiles }] = await Promise.all([
    supabase.from("children").select("id, first_name, last_name").in("id", childIds),
    supabase.from("profiles").select("id, full_name").in("id", parentIds),
  ]);

  const childMap = new Map(
    ((children ?? []) as { id: string; first_name: string; last_name: string }[]).map(
      (c) => [c.id, c]
    )
  );
  const profileMap = new Map(
    ((profiles ?? []) as { id: string; full_name: string }[]).map((p) => [p.id, p])
  );

  return rows.map((r) => {
    const child = childMap.get(r.child_id);
    const parent = profileMap.get(r.parent_id);
    const euros = (r.amount_cents / 100).toFixed(2).replace(".", ",") + " €";
    return {
      id: r.id,
      title: child ? `${child.first_name} ${child.last_name}` : "Paiement",
      subtitle: `${euros} · ${parent?.full_name ?? "Parent"}`,
      href: "/paiements",
      priority: "attention" as const,
      actionLabel: "Paiements",
    };
  });
}

function linksToItems(
  links: AdminParentLink[],
  filter: (l: AdminParentLink) => boolean,
  priority: CommandPriority,
  subtitleFn: (l: AdminParentLink) => string
): CommandItem[] {
  return links.filter(filter).map((l) => ({
    id: l.link_id,
    title: `${l.child_first_name} ${l.child_last_name}`,
    subtitle: subtitleFn(l),
    href: "/administration",
    priority,
    actionLabel: "Administration",
  }));
}

export async function getCommandCenter(role: UserRole): Promise<CommandCenterData> {
  const today = getLocalTodayISO();
  const tomorrow = addDaysToIso(today, 1);
  const sections: CommandSection[] = [];
  let loadError: string | null = null;

  if (isStaffLimitedAccess(role)) {
    const todayActivities = await getActivitiesForDate(today);
    sections.push(
      await buildActivitySection(
        "today",
        "Aujourd'hui",
        "Marque qui est présent ou absent",
        todayActivities,
        "urgent",
        true
      )
    );

    const urgentCount = todayActivities.length;
    const visible = sections.filter((s) => s.items.length > 0);
    return {
      actionSections: visible,
      infoSections: [],
      urgentCount,
      attentionCount: 0,
      allClear: urgentCount === 0,
      loadError: null,
    };
  }

  const [
    { links, loadError: linksError },
    todayActivities,
    tomorrowActivities,
    deferredItems,
    pendingPaymentItems,
    { requests: schoolSupportRequests },
  ] = await Promise.all([
    canManageUsers(role) ? getParentLinksForAdmin() : Promise.resolve({ links: [], loadError: null }),
    getActivitiesForDate(today),
    getActivitiesForDate(tomorrow),
    getDeferredParticipationItems(),
    canRecordPayment(role) ? getPendingPaymentItems() : Promise.resolve([]),
    canManageUsers(role)
      ? getSchoolSupportAdminQueue()
      : Promise.resolve({ requests: [], loadError: null }),
  ]);

  loadError = linksError;

  sections.push(
    await buildActivitySection(
      "today",
      "Aujourd'hui",
      "Marque qui est présent ou absent",
      todayActivities,
      "urgent",
      true
    )
  );

  if (canManageUsers(role)) {
    const soutienToConfirm = schoolSupportRequests.filter((r) => r.can_confirm);
    const soutienChildIds = new Set(soutienToConfirm.map((r) => r.child_id));

    const readyLinks = links.filter(
      (l) => isReadyToValidate(l) && !soutienChildIds.has(l.child_id)
    );
    if (readyLinks.length > 0) {
      sections.push({
        id: "validate",
        title: "Familles à accueillir",
        description: "Ces parents sont prêts — validez en un clic",
        items: readyLinks.map((l) => ({
            id: l.link_id,
            title: `${l.child_first_name} ${l.child_last_name}`,
            subtitle: `${l.parent_name} · ${l.parent_email}`,
            href: "/administration",
            priority: "urgent" as const,
            actionLabel: "Valider",
            quickAction: "validate_parent" as const,
            quickActionId: l.link_id,
        })),
        priority: "urgent",
      });
    }

    const paymentWaitItems = linksToItems(
      links,
      isWaitingPayment,
      "attention",
      (l) => `Cotisation en attente · ${l.parent_name}`
    );
    if (paymentWaitItems.length > 0) {
      sections.push({
        id: "waiting-payment",
        title: "Cotisations en attente",
        description: "Ces familles n'ont pas encore payé — sans pression",
        items: paymentWaitItems,
        priority: "attention",
      });
    }

    if (soutienToConfirm.length > 0) {
      sections.push({
        id: "school-support",
        title: "Accompagnement scolaire à confirmer",
        description: "Ces parents ont activé le soutien scolaire — confirmez en un clic",
        items: soutienToConfirm.map((r) => ({
          id: r.membership_id,
          title: r.child_name,
          subtitle: `${r.parent_name} · ${r.fee_label}`,
          href: "/administration",
          priority: "urgent" as const,
          actionLabel: "Confirmer",
          quickAction: "confirm_school_support" as const,
          quickActionId: r.child_id,
        })),
        priority: "urgent",
      });
    }

    const soutienPayment = schoolSupportRequests.filter((r) => !r.can_confirm);
    if (soutienPayment.length > 0) {
      sections.push({
        id: "school-support-payment",
        title: "Soutien scolaire — paiement en attente",
        description: "Le parent doit encore régler la cotisation",
        items: soutienPayment.map((r) => ({
          id: r.membership_id,
          title: r.child_name,
          subtitle: `${r.parent_name} · ${r.fee_label}`,
          href: "/administration",
          priority: "attention" as const,
          actionLabel: "Voir",
        })),
        priority: "attention",
      });
    }
  }

  if (deferredItems.length > 0) {
    sections.push({
      id: "deferred",
      title: "Familles à accompagner",
      description: "Inscriptions avec paiement reporté — avec bienveillance",
      items: deferredItems,
      priority: "attention",
    });
  }

  if (pendingPaymentItems.length > 0) {
    sections.push({
      id: "payments",
      title: "Paiements à vérifier",
      description: "Transactions en cours de traitement",
      items: pendingPaymentItems,
      priority: "attention",
    });
  }

  const tomorrowSection = await buildActivitySection(
    "tomorrow",
    "Demain",
    "Activités prévues demain",
    tomorrowActivities,
    "info",
    false
  );

  const actionSections = sections.filter(
    (s) => s.items.length > 0 && s.priority !== "info"
  );
  const infoSections = [
    ...(tomorrowSection.items.length > 0 ? [tomorrowSection] : []),
  ];

  const urgentCount = actionSections
    .filter((s) => s.priority === "urgent")
    .reduce((n, s) => n + s.items.length, 0);
  const attentionCount = actionSections
    .filter((s) => s.priority === "attention")
    .reduce((n, s) => n + s.items.length, 0);

  return {
    actionSections,
    infoSections,
    urgentCount,
    attentionCount,
    allClear: actionSections.length === 0,
    loadError,
  };
}
