import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

async function hasConfirmedMembershipPayment(
  admin: ReturnType<typeof createAdminClient>,
  childId: string,
  membershipId: string | null
): Promise<boolean> {
  if (!membershipId) {
    return false;
  }

  const { data, error } = await admin
    .from("payments")
    .select("id")
    .eq("child_id", childId)
    .eq("status", "PAID")
    .eq("purpose", "MEMBERSHIP")
    .eq("reference_id", membershipId)
    .limit(1)
    .maybeSingle();

  return !error && !!data;
}

/** Met à jour enfant + adhésion après paiement (atomique si migration 026). */
export async function syncEnrollmentPaid(
  childId: string,
  membershipId: string | null
): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient();

  const { error: rpcError } = await admin.rpc("sync_enrollment_paid", {
    p_child_id: childId,
    p_membership_id: membershipId ?? undefined,
  });

  if (!rpcError) {
    return { ok: true };
  }

  const isRpcMissing =
    rpcError.message.includes("Could not find the function") ||
    rpcError.message.includes("sync_enrollment_paid");

  // Migration 027 : reference_id UUID comparé à TEXT — fallback direct jusqu'à 030 appliquée
  const isReferenceIdTypeBug =
    rpcError.code === "42883" && rpcError.message.includes("uuid = text");

  if (!isRpcMissing && !isReferenceIdTypeBug) {
    return { ok: false, error: rpcError.message };
  }

  const paymentConfirmed = await hasConfirmedMembershipPayment(
    admin,
    childId,
    membershipId
  );
  if (!paymentConfirmed) {
    return { ok: false, error: "payment_not_confirmed" };
  }

  const { error: childError } = await admin
    .from("children")
    .update({ enrollment_status: "PAYE_EN_ATTENTE_ASBL" })
    .eq("id", childId);

  if (childError) {
    return { ok: false, error: childError.message };
  }

  if (membershipId) {
    const { error: membershipError } = await admin
      .from("memberships")
      .update({ status: "AWAITING_ASBL" })
      .eq("id", membershipId)
      .eq("status", "AWAITING_PAYMENT");

    if (membershipError) {
      return { ok: false, error: membershipError.message };
    }
  }

  return { ok: true };
}
