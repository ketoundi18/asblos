import { createClient } from "@/lib/supabase/server";
import type { AuditAction } from "@/lib/audit/log-audit";

export type AuditLogEntry = {
  id: string;
  occurred_at: string;
  actor_id: string | null;
  actor_name: string | null;
  actor_role: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, unknown>;
};

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export async function getAuditLogs(options?: {
  limit?: number;
  action?: AuditAction | null;
}): Promise<{
  logs: AuditLogEntry[];
  loadError: string | null;
}> {
  const supabase = await createClient();
  const limit = Math.min(
    Math.max(options?.limit ?? DEFAULT_LIMIT, 1),
    MAX_LIMIT
  );

  let query = supabase
    .from("logs_audit")
    .select(
      "id, occurred_at, actor_id, actor_role, action, entity_type, entity_id, metadata"
    )
    .order("occurred_at", { ascending: false })
    .limit(limit);

  if (options?.action) {
    query = query.eq("action", options.action);
  }

  const { data: rows, error } = await query;

  if (error) {
    if (
      error.code === "42P01" ||
      error.message.includes("does not exist") ||
      error.message.includes("logs_audit")
    ) {
      return {
        logs: [],
        loadError: "Lance la migration 025_logs_audit.sql dans Supabase.",
      };
    }
    if (error.code === "42501" || error.message.includes("permission")) {
      return {
        logs: [],
        loadError: "Accès réservé aux administrateurs.",
      };
    }
    return {
      logs: [],
      loadError: `Impossible de charger le journal : ${error.message}`,
    };
  }

  const logRows = (rows ?? []) as {
    id: string;
    occurred_at: string;
    actor_id: string | null;
    actor_role: string | null;
    action: string;
    entity_type: string;
    entity_id: string;
    metadata: Record<string, unknown> | null;
  }[];

  if (logRows.length === 0) {
    return { logs: [], loadError: null };
  }

  const actorIds = [
    ...new Set(
      logRows.map((r) => r.actor_id).filter((id): id is string => Boolean(id))
    ),
  ];

  const actorNames = new Map<string, string>();

  if (actorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", actorIds);

    for (const p of (profiles ?? []) as { id: string; full_name: string }[]) {
      actorNames.set(p.id, p.full_name);
    }
  }

  const logs: AuditLogEntry[] = logRows.map((row) => ({
    id: row.id,
    occurred_at: row.occurred_at,
    actor_id: row.actor_id,
    actor_name: row.actor_id ? (actorNames.get(row.actor_id) ?? null) : null,
    actor_role: row.actor_role,
    action: row.action,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    metadata:
      row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
        ? row.metadata
        : {},
  }));

  return { logs, loadError: null };
}
