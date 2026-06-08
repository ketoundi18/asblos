import "server-only";
import { syncEnrollmentPaid } from "@/lib/payments/sync-enrollment-paid";
import { logAuditEvent } from "@/lib/audit/log-audit";

/** Marque cotisation + enfant payés — service role uniquement (post-Mollie ou simulation). */
export async function markMembershipPaidAsAdmin(
  childId: string,
  membershipId: string | null
): Promise<{ ok: boolean; error?: string }> {
  try {
    const synced = await syncEnrollmentPaid(childId, membershipId);
    if (!synced.ok) {
      return synced;
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
