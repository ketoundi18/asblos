import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { canExportReports } from "@/lib/auth/permissions";
import { getAuditLogs } from "@/lib/data/audit-logs";
import { AuditLogPanel } from "@/components/admin/audit-log-panel";
import { AuditLogFilterForm } from "@/components/admin/audit-log-filter-form";
import { AUDIT_ACTION_OPTIONS } from "@/lib/audit/audit-labels";
import type { AuditAction } from "@/lib/audit/log-audit";
import { resolveLoadErrorToast } from "@/lib/messages/flash-messages";
import { ServerNoticeToast } from "@/components/ui/server-notice-toast";
import { FileDown } from "lucide-react";

const VALID_ACTIONS = new Set<string>(
  AUDIT_ACTION_OPTIONS.map((o) => o.value)
);

type RapportsPageProps = {
  searchParams: Promise<{ action?: string }>;
};

export default async function RapportsPage({ searchParams }: RapportsPageProps) {
  const profile = await getCurrentProfile();

  if (!profile || !canExportReports(profile.role)) {
    redirect("/");
  }

  const params = await searchParams;
  const actionFilter =
    params.action && VALID_ACTIONS.has(params.action)
      ? (params.action as AuditAction)
      : null;

  const { logs, loadError } = await getAuditLogs({ action: actionFilter });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Rapports & journal</h1>
        <p className="text-muted-foreground">
          Historique des actions importantes — validations, paiements, réglages.
        </p>
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Journal d&apos;audit</h2>
            <p className="text-sm text-muted-foreground">
              {logs.length} événement{logs.length > 1 ? "s" : ""} récent
              {logs.length > 1 ? "s" : ""}
              {actionFilter ? " · filtre actif" : ""}
            </p>
          </div>

          <AuditLogFilterForm currentAction={actionFilter} />
        </div>

        {loadError ? (
          <>
            <ServerNoticeToast flash={resolveLoadErrorToast(loadError, "staff")} />
            <AuditLogPanel logs={[]} />
          </>
        ) : (
          <AuditLogPanel logs={logs} />
        )}
      </section>

      <section className="rounded-lg border border-dashed bg-muted/30 p-6">
        <div className="flex items-start gap-3">
          <FileDown className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
          <div className="space-y-1">
            <h2 className="font-semibold text-muted-foreground">
              Exports PDF & Excel
            </h2>
            <p className="text-sm text-muted-foreground">
              Les exports téléchargeables (présences, paiements, listes d&apos;enfants)
              arriveront dans une prochaine version. Le journal ci-dessus est déjà
              opérationnel.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
