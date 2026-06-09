import { getParentLinksForAdmin } from "@/lib/data/parent-admin";
import type { UserRole } from "@/lib/auth/roles";
import { canRecordPayment, isStaffLimitedAccess } from "@/lib/auth/permissions";
import { buildAdminDashboardActions } from "@/lib/data/staff-dashboard/build-admin-actions";
import { buildLimitedAccessActions } from "@/lib/data/staff-dashboard/build-limited-actions";
import {
  getDeferredParticipationsCount,
  getPendingPaymentsCount,
  getWeekActivityCount,
} from "@/lib/data/staff-dashboard/dashboard-counts";
import { getTodayActivities } from "@/lib/data/staff-dashboard/today-activities";
import type { StaffDashboardData } from "@/lib/data/staff-dashboard/types";

export async function getStaffDashboard(role: UserRole): Promise<StaffDashboardData> {
  const todayActivities = await getTodayActivities();

  if (isStaffLimitedAccess(role)) {
    return {
      actions: buildLimitedAccessActions(todayActivities),
      todayActivities,
      loadError: null,
    };
  }

  const [{ links, loadError: linksError }, weekCount, pendingPayments, deferredCount] =
    await Promise.all([
      getParentLinksForAdmin(),
      getWeekActivityCount(),
      canRecordPayment(role) ? getPendingPaymentsCount() : Promise.resolve(0),
      getDeferredParticipationsCount(),
    ]);

  return {
    actions: buildAdminDashboardActions(
      role,
      links,
      { weekCount, pendingPayments, deferredCount },
      todayActivities
    ),
    todayActivities,
    loadError: linksError,
  };
}
