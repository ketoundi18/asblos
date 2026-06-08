import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/audit/log-audit";

/** Marque cotisation + enfant payés — service role uniquement (post-Mollie ou simulation). */
export async function markMembershipPaidAsAdmin(
  childId: string,
  membershipId: string | null
): Promise<{ ok: boolean; error?: string }> {
  try {
    const admin = createAdminClient();

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

    await logAuditEvent({
      action: "PAYMENT_PAID",
      entityType: "children",
      entityId: childId,
      metadata: {
        membership_id: membershipId,
        source: "mark_membership_paid_admin",
      },
    });

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "mark_membership_paid_failed",
    };
  }
}
