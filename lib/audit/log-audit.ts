import "server-only";
import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

/** Actions d'audit connues — extensible sans migration SQL. */
export type AuditAction =
  | "CHILD_VALIDATED"
  | "CHILD_REJECTED"
  | "CHILD_CREATED"
  | "CHILD_ANONYMIZED"
  | "PARENT_LINK_VERIFIED"
  | "PAYMENT_PAID"
  | "PAYMENT_FAILED"
  | "MEMBERSHIP_ACTIVATED"
  | "ASBL_SETTINGS_UPDATED";

export type AuditEntityType =
  | "children"
  | "payments"
  | "memberships"
  | "profiles"
  | "parent_child_links"
  | "asbl_settings";

export type LogAuditInput = {
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  actorId?: string | null;
  actorRole?: string | null;
  metadata?: Record<string, Json | undefined>;
  ipHash?: string | null;
};

/** Empreinte IP (RGPD) — jamais l'IP en clair en base. */
export function hashAuditIp(ip: string | null | undefined): string | null {
  if (!ip?.trim()) return null;
  const salt =
    process.env.AUDIT_IP_SALT ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    "asblos-audit";
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
    } as never);

    if (error) {
      console.error("[audit] insert failed:", input.action, error.message);
    }
  } catch (err) {
    console.error(
      "[audit] unavailable:",
      input.action,
      err instanceof Error ? err.message : err
    );
  }
}
