import "server-only";

/** Supprime un enfant créé partiellement (CASCADE lien, tuteur, adhésion). */
export async function rollbackPartialParentEnrollment(
  childId: string
): Promise<void> {
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    await admin.from("children").delete().eq("id", childId);
  } catch {
    // Rollback best-effort — l'admin pourra nettoyer manuellement si besoin
  }
}
