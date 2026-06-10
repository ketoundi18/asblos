import "server-only";
import type { ServerSupabase } from "@/lib/supabase/server-types";
import { writeStaffResetEnrollmentDraft } from "@/lib/enrollment/enrollment-writes";
import { getCurrentSchoolYear } from "@/lib/school-year";

/** Annule lien parent + statut inscription si l'adhésion staff échoue après coup. */
export async function rollbackStaffEnrollmentAttach(
  supabase: ServerSupabase,
  childId: string,
  parentId: string
): Promise<void> {
  try {
    await supabase
      .from("parent_child_links")
      .delete()
      .eq("child_id", childId)
      .eq("parent_id", parentId);

    await writeStaffResetEnrollmentDraft(supabase, childId, getCurrentSchoolYear());
  } catch {
    // Best-effort — l'admin pourra corriger la fiche manuellement
  }
}

/** Supprime une adhésion créée si le soutien scolaire n'a pas pu être finalisé. */
export async function rollbackStaffMembershipOnly(
  supabase: ServerSupabase,
  membershipId: string
): Promise<void> {
  try {
    await supabase.from("memberships").delete().eq("id", membershipId);
  } catch {
    // Best-effort
  }
}
