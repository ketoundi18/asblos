import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/** Met à jour enfant + adhésion après paiement (atomique si migration 026). */
export async function syncEnrollmentPaid(
  childId: string,
  membershipId: string | null
): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient();

  const { error: rpcError } = await admin.rpc(
    "sync_enrollment_paid" as never,
    {
      p_child_id: childId,
      p_membership_id: membershipId,
    } as never
  );

  if (!rpcError) {
    return { ok: true };
  }

  if (
    !rpcError.message.includes("Could not find the function") &&
    !rpcError.message.includes("sync_enrollment_paid")
  ) {
    return { ok: false, error: rpcError.message };
  }

  const { error: childError } = await admin
    .from("children")
    .update({ enrollment_status: "PAYE_EN_ATTENTE_ASBL" } as never)
    .eq("id", childId);

  if (childError) {
    return { ok: false, error: childError.message };
  }

  if (membershipId) {
    const { error: membershipError } = await admin
      .from("memberships")
      .update({ status: "AWAITING_ASBL" } as never)
      .eq("id", membershipId)
      .eq("status", "AWAITING_PAYMENT");

    if (membershipError) {
      return { ok: false, error: membershipError.message };
    }
  }

  return { ok: true };
}
