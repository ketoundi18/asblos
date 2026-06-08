import "server-only";
import type { ServerSupabase } from "@/lib/supabase/server-types";
import { resolveParentProfileByEmail } from "@/lib/enrollment/resolve-parent-by-email";

export async function resolveParentIdForChild(
  supabase: ServerSupabase,
  childId: string
): Promise<string | null> {
  const { data: link } = await supabase
    .from("parent_child_links")
    .select("parent_id")
    .eq("child_id", childId)
    .order("verified_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle<{ parent_id: string }>();

  if (link?.parent_id) return link.parent_id;

  const { data: guardian } = await supabase
    .from("guardians")
    .select("email")
    .eq("child_id", childId)
    .eq("is_primary", true)
    .maybeSingle<{ email: string | null }>();

  if (!guardian?.email) return null;

  const parent = await resolveParentProfileByEmail(supabase, guardian.email);
  return parent?.id ?? null;
}
