import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/auth/roles";
import {
  formatMonthLabel,
  monthStartIso,
  parseMonthParam,
} from "@/lib/data/equipe/month-param";

export type StaffMonthlyReportRow = {
  userId: string;
  fullName: string;
  role: UserRole;
  workedMinutes: number;
  sessionsCount: number;
  balanceMinutes: number;
  targetMinutesPerDay: number | null;
};

export async function getStaffMonthlyReport(monthParam?: string): Promise<{
  monthParam: string;
  monthLabel: string;
  rows: StaffMonthlyReportRow[];
  loadError: string | null;
}> {
  const month = parseMonthParam(monthParam);
  const monthStart = monthStartIso(month);
  const supabase = await createClient();

  const [membersResult, reportResult, balancesResult, contractsResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, role")
        .in("role", ["TRAVAILLEUR", "STAGIAIRE", "BENEVOLE"])
        .eq("is_active", true)
        .order("full_name", { ascending: true }),
      supabase
        .from("staff_monthly_flex_report")
        .select("user_id, worked_minutes, sessions_count")
        .eq("month_start", monthStart),
      supabase.from("staff_time_balances").select("user_id, balance_minutes"),
      supabase
        .from("staff_time_contracts")
        .select("user_id, target_minutes")
        .is("valid_until", null),
    ]);

  const firstError =
    membersResult.error?.message ??
    reportResult.error?.message ??
    balancesResult.error?.message ??
    contractsResult.error?.message ??
    null;

  if (firstError?.includes("does not exist")) {
    return {
      monthParam: month,
      monthLabel: formatMonthLabel(month),
      rows: [],
      loadError: "migration_required",
    };
  }

  if (firstError) {
    return {
      monthParam: month,
      monthLabel: formatMonthLabel(month),
      rows: [],
      loadError: firstError,
    };
  }

  const workedByUser = new Map<string, { workedMinutes: number; sessionsCount: number }>();
  for (const row of reportResult.data ?? []) {
    if (!row.user_id) continue;
    workedByUser.set(row.user_id, {
      workedMinutes: row.worked_minutes ?? 0,
      sessionsCount: row.sessions_count ?? 0,
    });
  }

  const balanceByUser = new Map<string, number>();
  for (const row of balancesResult.data ?? []) {
    balanceByUser.set(row.user_id, row.balance_minutes);
  }

  const targetByUser = new Map<string, number>();
  for (const row of contractsResult.data ?? []) {
    targetByUser.set(row.user_id, row.target_minutes);
  }

  const rows: StaffMonthlyReportRow[] = (membersResult.data ?? []).map((member) => {
    const stats = workedByUser.get(member.id);
    return {
      userId: member.id,
      fullName: member.full_name,
      role: member.role as UserRole,
      workedMinutes: stats?.workedMinutes ?? 0,
      sessionsCount: stats?.sessionsCount ?? 0,
      balanceMinutes: balanceByUser.get(member.id) ?? 0,
      targetMinutesPerDay: targetByUser.get(member.id) ?? null,
    };
  });

  return {
    monthParam: month,
    monthLabel: formatMonthLabel(month),
    rows,
    loadError: null,
  };
}
