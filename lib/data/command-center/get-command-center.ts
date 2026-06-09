import { getParentLinksForAdmin } from "@/lib/data/parent-admin";
import { getSchoolSupportAdminQueue } from "@/lib/data/school-support-admin";
import { addDaysToIso, getLocalTodayISO } from "@/lib/date-utils";
import type { UserRole } from "@/lib/auth/roles";
import {
  canManageUsers,
  canRecordPayment,
  isStaffLimitedAccess,
} from "@/lib/auth/permissions";
import {
  buildActivitySection,
  getActivitiesForDate,
} from "@/lib/data/command-center/activity-sections";
import { buildAdminCommandSections } from "@/lib/data/command-center/admin-sections";
import { getDeferredParticipationItems } from "@/lib/data/command-center/deferred-participation-items";
import { getPendingPaymentItems } from "@/lib/data/command-center/pending-payment-items";
import type { CommandCenterData, CommandSection } from "@/lib/data/command-center/types";

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
    sections.push(...buildAdminCommandSections(links, schoolSupportRequests));
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
