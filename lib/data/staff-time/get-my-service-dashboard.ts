import { createClient } from "@/lib/supabase/server";
import { addDaysToIso, getLocalTodayISO } from "@/lib/date-utils";
import {
  formatBrusselsDateLabel,
  getBrusselsDateIso,
  getBrusselsDayStartQueryInstant,
  getBrusselsMonthStartIso,
} from "@/lib/data/staff-time/brussels-date";
import type { MyServiceDashboard, ServiceHistoryDay, ServiceLedgerMovement } from "@/lib/data/staff-time/types";

type EntryRow = {
  id: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  status: string;
};

function isMissingTable(message: string | undefined): boolean {
  return Boolean(message?.includes("does not exist"));
}

function entryMinutes(entry: EntryRow, nowMs: number): number {
  if (entry.duration_minutes != null) return entry.duration_minutes;
  if (entry.ended_at) {
    const ms = new Date(entry.ended_at).getTime() - new Date(entry.started_at).getTime();
    return Math.max(0, Math.floor(ms / 60_000));
  }
  return Math.max(0, Math.floor((nowMs - new Date(entry.started_at).getTime()) / 60_000));
}

function buildHistory(entries: EntryRow[], sinceDate: string, nowMs: number): ServiceHistoryDay[] {
  const byDate = new Map<string, { totalMinutes: number; sessionsCount: number }>();

  for (const entry of entries) {
    const date = getBrusselsDateIso(entry.started_at);
    if (date < sinceDate) continue;
    const minutes = entryMinutes(entry, nowMs);
    const current = byDate.get(date) ?? { totalMinutes: 0, sessionsCount: 0 };
    byDate.set(date, {
      totalMinutes: current.totalMinutes + minutes,
      sessionsCount: current.sessionsCount + 1,
    });
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, stats]) => ({
      date,
      dateLabel: formatBrusselsDateLabel(date),
      totalMinutes: stats.totalMinutes,
      sessionsCount: stats.sessionsCount,
    }));
}

function emptyDashboard(loadError: string | null): MyServiceDashboard {
  return {
    openEntry: null,
    todayWorkedMinutes: 0,
    monthWorkedMinutes: 0,
    balanceMinutes: 0,
    balanceAvailable: false,
    contractAvailable: false,
    ledgerAvailable: false,
    history: [],
    ledgerMovements: [],
    activeContract: null,
    loadError,
    partialLoadErrors: [],
  };
}

export async function getMyServiceDashboard(userId: string): Promise<MyServiceDashboard> {
  const supabase = await createClient();
  const today = getLocalTodayISO();
  const historySince = addDaysToIso(today, -30);
  const nowMs = Date.now();
  const monthStart = getBrusselsMonthStartIso(new Date(nowMs).toISOString());

  const queryStartInstant = getBrusselsDayStartQueryInstant(historySince);

  const [entriesResult, balanceResult, contractResult, ledgerResult] = await Promise.all([
    supabase
      .from("staff_time_entries")
      .select("id, started_at, ended_at, duration_minutes, status")
      .eq("user_id", userId)
      .gte("started_at", queryStartInstant)
      .order("started_at", { ascending: false }),
    supabase
      .from("staff_time_balances")
      .select("balance_minutes")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("staff_time_contracts")
      .select("target_minutes, work_days")
      .eq("user_id", userId)
      .is("valid_until", null)
      .lte("valid_from", today)
      .maybeSingle(),
    supabase
      .from("staff_time_ledger")
      .select("id, delta_minutes, balance_after, reference_date, label")
      .eq("user_id", userId)
      .order("reference_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const entriesError = entriesResult.error?.message;

  if (isMissingTable(entriesError)) {
    return emptyDashboard("migration_required");
  }

  if (entriesResult.error) {
    return emptyDashboard(entriesResult.error.message);
  }

  const entries = (entriesResult.data ?? []) as EntryRow[];
  const openRow = entries.find(
    (entry) => entry.status === "OPEN" && entry.ended_at == null
  );

  let todayWorkedMinutes = 0;
  let monthWorkedMinutes = 0;

  for (const entry of entries) {
    const date = getBrusselsDateIso(entry.started_at);
    const minutes = entryMinutes(entry, nowMs);
    if (date === today) todayWorkedMinutes += minutes;
    if (date >= monthStart) monthWorkedMinutes += minutes;
  }

  const partialLoadErrors: string[] = [];

  if (balanceResult.error) {
    partialLoadErrors.push(
      isMissingTable(balanceResult.error.message)
        ? "migration_required"
        : "balance_unavailable"
    );
  }

  if (contractResult.error) {
    partialLoadErrors.push(
      isMissingTable(contractResult.error.message)
        ? "migration_required"
        : "contract_unavailable"
    );
  }

  if (ledgerResult.error) {
    partialLoadErrors.push(
      isMissingTable(ledgerResult.error.message)
        ? "migration_required"
        : "ledger_unavailable"
    );
  }

  const uniquePartialErrors = [...new Set(partialLoadErrors)];

  const balanceAvailable = !balanceResult.error;
  const contractAvailable = !contractResult.error;
  const ledgerAvailable = !ledgerResult.error;

  const activeContract =
    contractAvailable && contractResult.data
      ? {
          targetMinutes: contractResult.data.target_minutes,
          workDays: contractResult.data.work_days,
        }
      : null;

  const balanceMinutes =
    balanceAvailable && balanceResult.data
      ? balanceResult.data.balance_minutes
      : 0;

  const ledgerMovements: ServiceLedgerMovement[] = ledgerAvailable
    ? (ledgerResult.data ?? []).map((row) => ({
        id: row.id,
        referenceDate: row.reference_date,
        referenceDateLabel: formatBrusselsDateLabel(row.reference_date),
        deltaMinutes: row.delta_minutes,
        balanceAfter: row.balance_after,
        label: row.label,
      }))
    : [];

  return {
    openEntry: openRow
      ? { id: openRow.id, startedAt: openRow.started_at }
      : null,
    todayWorkedMinutes,
    monthWorkedMinutes,
    balanceMinutes,
    balanceAvailable,
    contractAvailable,
    ledgerAvailable,
    history: buildHistory(entries, historySince, nowMs),
    ledgerMovements,
    activeContract,
    loadError: null,
    partialLoadErrors: uniquePartialErrors,
  };
}
