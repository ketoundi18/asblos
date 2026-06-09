import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth/session";
import { canManageActivities, canManageUsers } from "@/lib/auth/permissions";
import { getSchoolSupportAdminQueue } from "@/lib/data/school-support-admin";
import { SchoolSupportAdminPanel } from "@/components/admin/school-support-admin-panel";
import { resolveLoadErrorToast } from "@/lib/messages/flash-messages";
import { ServerNoticeToast } from "@/components/ui/server-notice-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default async function SoutienScolaireDemandesPage() {
  const profile = await getCurrentProfile();
  if (!profile || !canManageActivities(profile.role)) {
    redirect("/");
  }

  const { requests, loadError } = await getSchoolSupportAdminQueue();
  const toConfirm = requests.filter((r) => r.can_confirm).length;
  const waitingPayment = requests.length - toConfirm;

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href="/soutien-scolaire">
            <ArrowLeft className="h-4 w-4" />
            Soutien scolaire
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Demandes soutien scolaire</h1>
        <p className="text-muted-foreground">
          Suivez les inscriptions parent à la formule soutien scolaire et confirmez les
          dossiers prêts.
        </p>
      </div>

      {loadError ? (
        <ServerNoticeToast flash={resolveLoadErrorToast(loadError, "staff")} />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total en attente" value={requests.length} />
        <StatCard label="À confirmer" value={toConfirm} highlight={toConfirm > 0} />
        <StatCard label="Paiement en attente" value={waitingPayment} />
      </div>

      <Suspense
        fallback={
          <Card>
            <CardContent className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <LoadingSpinner />
              Chargement des demandes…
            </CardContent>
          </Card>
        }
      >
        <SchoolSupportAdminPanel
          requests={requests}
          showDetails
          canConfirmActions={canManageUsers(profile.role)}
          returnTo="/soutien-scolaire/demandes"
        />
      </Suspense>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-warning-border bg-warning-muted/40" : ""}>
      <CardContent className="py-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
