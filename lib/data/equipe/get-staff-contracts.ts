import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/auth/roles";

export type StaffContractRow = {
  id: string;
  user_id: string;
  target_minutes: number;
  work_days: number[];
  valid_from: string;
  full_name: string;
  role: UserRole;
};

export async function getActiveStaffContracts(): Promise<{
  contracts: StaffContractRow[];
  loadError: string | null;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("staff_time_contracts")
    .select(
      "id, user_id, target_minutes, work_days, valid_from, profiles!inner(full_name, role)"
    )
    .is("valid_until", null)
    .order("valid_from", { ascending: false });

  if (error) return { contracts: [], loadError: error.message };

  const contracts = (data ?? []).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      id: row.id,
      user_id: row.user_id,
      target_minutes: row.target_minutes,
      work_days: row.work_days,
      valid_from: row.valid_from,
      full_name: (profile as { full_name: string; role: UserRole }).full_name,
      role: (profile as { full_name: string; role: UserRole }).role,
    };
  });

  return { contracts, loadError: null };
}
