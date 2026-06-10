import "server-only";
import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { reportError } from "@/lib/monitoring/report-error";
import type { Json } from "@/types/database";

/** Actions d'audit connues — extensible sans migration SQL. */
export type AuditAction =
  | "CHILD_VALIDATED"
  | "CHILD_REJECTED"
  | "CHILD_CREATED"
  | "CHILD_ANONYMIZED"
  | "CHILD_ARCHIVED"
  | "PARENT_LINK_VERIFIED"
  | "PAYMENT_PAID"
  | "PAYMENT_FAILED"
  | "MEMBERSHIP_ACTIVATED"
  | "ASBL_SETTINGS_UPDATED"
  | "STAFF_CLOCK_IN"
  | "STAFF_CLOCK_OUT"
  | "STAFF_TIME_SETTLEMENT"
  | "STAFF_TIME_ADJUSTMENT"
  | "STAFF_ACCOUNT_CREATED"
  | "STAFF_ACCOUNT_ACTIVATED"
  | "STAFF_ACCOUNT_DEACTIVATED"
  | "STAFF_CONTRACT_CREATED"
  | "STAFF_CONTRACT_UPDATED"
  | "PASSWORD_CHANGED"
  | "USER_SIGNED_IN";

export type AuditEntityType =
  | "children"
  | "payments"
  | "memberships"
  | "profiles"
  | "parent_child_links"
  | "asbl_settings"
  | "staff_time_entries"
  | "staff_time_ledger"
  | "staff_time_contracts";

export type LogAuditInput = {
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  actorId?: string | null;
  actorRole?: string | null;
  metadata?: Record<string, Json | undefined>;
  ipHash?: string | null;
};

/** Empreinte IP (RGPD) — jamais l'IP en clair en base. Nécessite AUDIT_IP_SALT. */
export function hashAuditIp(ip: string | null | undefined): string | null {
  if (!ip?.trim()) return null;
  const salt = process.env.AUDIT_IP_SALT?.trim();
  if (!salt) {
    if (process.env.NODE_ENV === "production") {
      void reportError(new Error("AUDIT_IP_SALT manquant — ip_hash ignoré"), {
        surface: "audit",
        code: "missing_audit_ip_salt",
      });
    }
    return null;
  }
  return createHash("sha256")
    .update(`${salt}:${ip.trim()}`)
    .digest("hex")
    .slice(0, 64);
}

/**
 * Enregistre un événement d'audit via service role.
 * Ne lève jamais d'exception — l'action métier ne doit pas échouer si l'audit échoue.
 */
export async function logAuditEvent(input: LogAuditInput): Promise<void> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("logs_audit").insert({
      actor_id: input.actorId ?? null,
      actor_role: input.actorRole ?? null,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId,
      metadata: (input.metadata ?? {}) as Json,
      ip_hash: input.ipHash ?? null,
    });

    if (error) {
      void reportError(new Error(error.message), {
        surface: "audit",
        code: "insert_failed",
        action: input.action,
      });
    }
  } catch (err) {
    void reportError(err, {
      surface: "audit",
      code: "unavailable",
      action: input.action,
    });
  }
}
