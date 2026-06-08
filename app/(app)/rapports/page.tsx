import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { canExportReports } from "@/lib/auth/permissions";
import { getAuditLogs } from "@/lib/data/audit-logs";
import { AuditLogPanel } from "@/components/admin/audit-log-panel";
import { AUDIT_ACTION_OPTIONS } from "@/lib/audit/audit-labels";
import type { AuditAction } from "@/lib/audit/log-audit";
import { friendlyLoadError } from "@/lib/messages/flash-messages";
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

          <form method="get" className="flex flex-wrap items-center gap-2">
            <label htmlFor="audit-action-filter" className="sr-only">
              Filtrer par type d&apos;événement
            </label>
            <select
              id="audit-action-filter"
              name="action"
              defaultValue={actionFilter ?? ""}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Tous les événements</option>
              {AUDIT_ACTION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Filtrer
            </button>
            {actionFilter ? (
              <a
                href="/rapports"
                className="inline-flex h-10 items-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
              >
                Réinitialiser
              </a>
            ) : null}
          </form>
        </div>

        {loadError ? (
          <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {friendlyLoadError(loadError, "staff")}
          </div>
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
