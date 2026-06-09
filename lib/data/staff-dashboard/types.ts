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
