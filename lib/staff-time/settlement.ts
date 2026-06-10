import "server-only";

import { addDaysToIso, getLocalTodayISO } from "@/lib/date-utils";
import { createAdminClient } from "@/lib/supabase/admin";
import { reportError } from "@/lib/monitoring/report-error";

/** Jours passés rattrapés au 1er pointage (ordre chronologique). */
export const SETTLEMENT_CATCHUP_DAYS = 14;

export async function settleStaffTimeDay(
  userId: string,
  referenceDate: string
): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("settle_staff_time_day", {
    p_user_id: userId,
    p_reference_date: referenceDate,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Clôture les jours passés non encore réglés pour une personne.
 * Traite du plus ancien au plus récent pour un solde cohérent.
 */
export async function catchUpStaffTimeSettlements(userId: string): Promise<number> {
  const today = getLocalTodayISO();
  const sinceDate = addDaysToIso(today, -SETTLEMENT_CATCHUP_DAYS);
  const admin = createAdminClient();

  const { data: existingSettlements } = await admin
    .from("staff_time_ledger")
    .select("reference_date")
    .eq("user_id", userId)
    .eq("kind", "DAILY_SETTLEMENT")
    .gte("reference_date", sinceDate)
    .lt("reference_date", today);

  const alreadySettled = new Set(
    (existingSettlements ?? []).map((row) => row.reference_date)
  );

  let settledCount = 0;

  for (let daysAgo = SETTLEMENT_CATCHUP_DAYS; daysAgo >= 1; daysAgo--) {
    const referenceDate = addDaysToIso(today, -daysAgo);
    if (alreadySettled.has(referenceDate)) continue;

    try {
      const ledgerId = await settleStaffTimeDay(userId, referenceDate);
      if (ledgerId) settledCount += 1;
    } catch (err) {
      void reportError(err, {
        surface: "settlement-catch-up",
        userId,
        referenceDate,
      });
    }
  }

  return settledCount;
}

/** Clôture journalière batch (cron) — par défaut la veille (Europe/Brussels). */
export async function runDailyStaffTimeSettlement(
  referenceDate?: string
): Promise<{ count: number; referenceDate: string }> {
  const date = referenceDate ?? addDaysToIso(getLocalTodayISO(), -1);
  const admin = createAdminClient();

  const { data, error } = await admin.rpc("settle_staff_time_all_for_date", {
    p_reference_date: date,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { count: data ?? 0, referenceDate: date };
}
