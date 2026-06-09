import { createClient } from "@/lib/supabase/server";
import { addDaysToIso, getLocalTodayISO } from "@/lib/date-utils";

export async function getWeekActivityCount(): Promise<number> {
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

export async function getPendingPaymentsCount(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("status", "PENDING");

  if (error) return 0;
  return count ?? 0;
}

export async function getDeferredParticipationsCount(): Promise<number> {
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
