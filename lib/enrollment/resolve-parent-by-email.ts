import "server-only";
import type { ServerSupabase } from "@/lib/supabase/server-types";

export async function resolveParentProfileByEmail(
  supabase: ServerSupabase,
  email: string
): Promise<{ id: string } | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, role, is_active")
    .ilike("email", normalized)
    .maybeSingle<{ id: string; role: string; is_active: boolean }>();

  if (!data || data.role !== "PARENT" || !data.is_active) {
    return null;
  }

  return { id: data.id };
}
