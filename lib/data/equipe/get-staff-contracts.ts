import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/auth/roles";
import { reportError } from "@/lib/monitoring/report-error";

export type StaffContractRow = {
  id: string;
  user_id: string;
  target_minutes: number;
  work_days: number[];
  valid_from: string;
  full_name: string;
  role: UserRole;
};

function isMissingStaffTimeModule(message: string): boolean {
  return message.includes("does not exist");
}

export async function getActiveStaffContracts(): Promise<{
  contracts: StaffContractRow[];
  loadError: string | null;
}> {
  const supabase = await createClient();

  const { data: contractRows, error: contractsError } = await supabase
    .from("staff_time_contracts")
    .select("id, user_id, target_minutes, work_days, valid_from")
    .is("valid_until", null)
    .order("valid_from", { ascending: false });

  if (contractsError) {
    void reportError(new Error(contractsError.message), {
      surface: "getActiveStaffContracts",
      phase: "contracts",
    });
    return {
      contracts: [],
      loadError: isMissingStaffTimeModule(contractsError.message)
        ? "migration_required"
        : contractsError.message,
    };
  }

  const rows = contractRows ?? [];
  if (rows.length === 0) {
    return { contracts: [], loadError: null };
  }

  const userIds = [...new Set(rows.map((row) => row.user_id))];
  const { data: profileRows, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .in("id", userIds);

  if (profilesError) {
    void reportError(new Error(profilesError.message), {
      surface: "getActiveStaffContracts",
      phase: "profiles",
    });
    return { contracts: [], loadError: profilesError.message };
  }

  const profileById = new Map(
    (profileRows ?? []).map((p) => [p.id, p as { full_name: string; role: UserRole }])
  );

  const contracts: StaffContractRow[] = [];
  for (const row of rows) {
    const profile = profileById.get(row.user_id);
    if (!profile) continue;
    contracts.push({
      id: row.id,
      user_id: row.user_id,
      target_minutes: row.target_minutes,
      work_days: row.work_days,
      valid_from: row.valid_from,
      full_name: profile.full_name,
      role: profile.role,
    });
  }

  return { contracts, loadError: null };
}
