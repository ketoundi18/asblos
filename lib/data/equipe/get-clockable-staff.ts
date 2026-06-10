import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/auth/roles";

export type ClockableStaffMember = {
  id: string;
  full_name: string;
  role: UserRole;
};

const CLOCKABLE_ROLES: UserRole[] = ["TRAVAILLEUR", "STAGIAIRE", "BENEVOLE"];

export async function getClockableStaff(): Promise<{
  members: ClockableStaffMember[];
  loadError: string | null;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .in("role", CLOCKABLE_ROLES)
    .eq("is_active", true)
    .order("full_name", { ascending: true });

  if (error) return { members: [], loadError: error.message };
  return { members: (data ?? []) as ClockableStaffMember[], loadError: null };
}
