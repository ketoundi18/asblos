import Link from "next/link";
import { redirect } from "next/navigation";
import { Info } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth/session";
import { canClockStaffTime } from "@/lib/auth/permissions";
import { getMyServiceDashboard } from "@/lib/data/staff-time/get-my-service-dashboard";
import { formatDurationMinutes } from "@/lib/data/staff-time/format-duration";
import { ServiceClockCard } from "@/components/staff/time/service-clock-card";
import { ServiceHistoryList } from "@/components/staff/time/service-history-list";
import { ServiceLedgerList } from "@/components/staff/time/service-ledger-list";
import { ServiceTargetCard } from "@/components/staff/time/service-target-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { resolveFlashToast, resolveLoadErrorToast } from "@/lib/messages/flash-messages";
import { resolvePartialLoadToast } from "@/lib/messages/flash-load-errors";
import { ServerNoticeToast } from "@/components/ui/server-notice-toast";

type PageProps = {
  searchParams: Promise<{ success?: string; error?: string; detail?: string }>;
};

export default async function MonServicePage({ searchParams }: PageProps) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/connexion");

  if (!canClockStaffTime(profile.role)) {
    redirect("/?error=permission");
  }

  const params = await searchParams;
  const flash =
    params.success || params.error
      ? resolveFlashToast({
          success: params.success,
          error: params.error,
          detail: params.detail,
          audience: "staff",
        })
      : null;

  const dashboard = await getMyServiceDashboard(profile.id);
  const loadFlash = dashboard.loadError
    ? resolveLoadErrorToast(dashboard.loadError, "staff")
    : null;
  const partialFlash = resolvePartialLoadToast(dashboard.partialLoadErrors, "staff");

  const firstName = profile.full_name?.trim().split(/\s+/)[0];

  return (
    <div className="mx-auto min-h-[52rem] max-w-lg space-y-8">
      <PageHeader
        eyebrow="Mon service"
        title={firstName ? `Salut, ${firstName}` : "Mon service"}
        description="Pointe tes heures en un clic — pensé pour le téléphone sur le terrain."
      />

      {flash ? <ServerNoticeToast flash={flash} /> : null}
      {loadFlash ? <ServerNoticeToast flash={loadFlash} /> : null}
      {partialFlash ? <ServerNoticeToast flash={partialFlash} /> : null}

      <ServiceClockCard
        openEntry={dashboard.openEntry}
        todayWorkedMinutes={dashboard.todayWorkedMinutes}
      />

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Heures du jour"
          value={formatDurationMinutes(dashboard.todayWorkedMinutes)}
          variant={dashboard.openEntry ? "primary" : "default"}
        />
        {!dashboard.balanceAvailable ? (
          <StatCard label="Solde flexibilité" hint="Indisponible" variant="default" />
        ) : (
          <StatCard
            label="Solde flexibilité"
            hint={
              dashboard.balanceMinutes === 0
                ? "À jour"
                : dashboard.balanceMinutes > 0
                  ? `+${formatDurationMinutes(dashboard.balanceMinutes)}`
                  : `-${formatDurationMinutes(Math.abs(dashboard.balanceMinutes))}`
            }
            variant={
              dashboard.balanceMinutes > 0
                ? "success"
                : dashboard.balanceMinutes < 0
                  ? "warning"
                  : "default"
            }
          />
        )}
      </div>

      <ServiceTargetCard
        activeContract={dashboard.activeContract}
        todayWorkedMinutes={dashboard.todayWorkedMinutes}
        contractUnavailable={!dashboard.contractAvailable}
      />

      <div className="flex gap-3 rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
        <p>
          Le solde se met à jour <strong className="text-foreground">chaque nuit</strong> ou au
          prochain « Commencer ». Terminer met à jour tes heures du jour, pas le solde tout de
          suite.
        </p>
      </div>

      <ServiceHistoryList
        history={dashboard.history}
        monthWorkedMinutes={dashboard.monthWorkedMinutes}
      />

      <ServiceLedgerList
        movements={dashboard.ledgerMovements}
        balanceMinutes={dashboard.balanceMinutes}
        ledgerUnavailable={!dashboard.ledgerAvailable}
        balanceUnavailable={!dashboard.balanceAvailable}
      />

      <p className="text-center text-sm text-muted-foreground">
        Mot de passe temporaire reçu de l&apos;admin ?{" "}
        <Link href="/mon-compte" className="font-medium text-primary hover:underline">
          Change-le ici
        </Link>
      </p>
    </div>
  );
}
