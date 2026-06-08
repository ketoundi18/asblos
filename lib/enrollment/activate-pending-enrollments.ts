import "server-only";
import type { ServerSupabase } from "@/lib/supabase/server-types";

/** Passe les inscriptions programme de PENDING → ACTIVE après validation ASBL. */
export async function activatePendingSchoolSupportEnrollments(
  supabase: ServerSupabase,
  childId: string
) {
  await supabase
    .from("school_support_enrollments")
    .update({ status: "ACTIVE" } as never)
    .eq("child_id", childId)
    .eq("status", "PENDING")
    .is("cancelled_at", null);
}

/** Valide le lien parent si ce n'est pas déjà fait. */
export async function verifyParentLinkForChild(
  supabase: ServerSupabase,
  childId: string,
  verifiedAt: string
) {
  await supabase
    .from("parent_child_links")
    .update({ verified_at: verifiedAt } as never)
    .eq("child_id", childId)
    .is("verified_at", null);
}
