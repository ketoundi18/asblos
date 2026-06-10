import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/auth/roles";

export type StaffMemberRow = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
};

const STAFF_ROLES: UserRole[] = [
  "ADMIN",
  "TRAVAILLEUR",
  "STAGIAIRE",
  "BENEVOLE",
];

export async function getStaffMembers(): Promise<{
  members: StaffMemberRow[];
  loadError: string | null;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, is_active, created_at")
    .in("role", STAFF_ROLES)
    .order("full_name", { ascending: true });

  if (error) {
    return { members: [], loadError: error.message };
  }

  return { members: (data ?? []) as StaffMemberRow[], loadError: null };
}
