import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { AuditLogEntry } from "@/lib/data/audit-logs";
import {
  formatAuditDateTime,
  getAuditActionBadgeVariant,
  getAuditActionLabel,
  getAuditEntityHref,
  getAuditEntityLabel,
  summarizeAuditMetadata,
} from "@/lib/audit/audit-labels";
import { ROLE_LABELS } from "@/lib/auth/roles";
import type { UserRole } from "@/lib/auth/roles";
import { ClipboardList, ExternalLink } from "lucide-react";

type AuditLogPanelProps = {
  logs: AuditLogEntry[];
};

function formatActor(log: AuditLogEntry): string {
  if (log.actor_name) {
    const roleLabel =
      log.actor_role && log.actor_role in ROLE_LABELS
        ? ROLE_LABELS[log.actor_role as UserRole]
        : log.actor_role;
    return roleLabel ? `${log.actor_name} · ${roleLabel}` : log.actor_name;
  }
  if (log.metadata.source === "mollie_webhook") {
    return "Système · Mollie";
  }
  return "Système";
}

export function AuditLogPanel({ logs }: AuditLogPanelProps) {
  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
          <ClipboardList className="h-8 w-8 text-muted-foreground/60" aria-hidden />
          <p>Aucun événement enregistré pour l&apos;instant.</p>
          <p className="max-w-sm text-xs">
            Les validations, paiements et changements de tarif apparaîtront ici
            automatiquement.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ul className="space-y-3" aria-label="Journal d'audit">
      {logs.map((log) => {
        const summary = summarizeAuditMetadata(log.action, log.metadata);
        const entityHref = getAuditEntityHref(
          log.entity_type,
          log.entity_id,
          log.metadata
        );

        return (
          <li key={log.id}>
            <Card className="transition-colors hover:border-primary/30">
              <CardContent className="space-y-3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={getAuditActionBadgeVariant(log.action)}>
                        {getAuditActionLabel(log.action)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {getAuditEntityLabel(log.entity_type)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatAuditDateTime(log.occurred_at)}
                    </p>
                  </div>
                  {entityHref ? (
                    <Link
                      href={entityHref}
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      Voir
                      <ExternalLink className="h-3 w-3" aria-hidden />
                    </Link>
                  ) : null}
                </div>

                <div className="text-sm">
                  <p>
                    <span className="text-muted-foreground">Par : </span>
                    {formatActor(log)}
                  </p>
                  {summary ? (
                    <p className="mt-1 text-muted-foreground">{summary}</p>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
