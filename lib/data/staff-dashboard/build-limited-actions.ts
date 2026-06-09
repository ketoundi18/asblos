import type { StaffDashboardAction, StaffTodayActivity } from "@/lib/data/staff-dashboard/types";

export function buildLimitedAccessActions(
  todayActivities: StaffTodayActivity[]
): StaffDashboardAction[] {
  if (todayActivities.length > 0) {
    return [
      {
        id: "today",
        title: "Présences du jour",
        description: "Marquez qui est présent ou absent",
        count: todayActivities.length,
        href: `/activites/${todayActivities[0].id}/terrain`,
        urgent: true,
      },
    ];
  }

  return [
    {
      id: "activities",
      title: "Calendrier activités",
      description: "Voir les prochaines activités planifiées",
      count: 0,
      href: "/activites",
      urgent: false,
    },
  ];
}
