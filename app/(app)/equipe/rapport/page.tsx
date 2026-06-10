import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth/session";
import { canManageUsers } from "@/lib/auth/permissions";
import { getStaffMonthlyReport } from "@/lib/data/equipe/get-staff-monthly-report";
import { StaffMonthlyReportFilters } from "@/components/equipe/staff-monthly-report-filters";
import { StaffMonthlyReportTable } from "@/components/equipe/staff-monthly-report-table";
import { resolveLoadErrorToast } from "@/lib/messages/flash-messages";
import { ServerNoticeToast } from "@/components/ui/server-notice-toast";

type PageProps = {
  searchParams: Promise<{ month?: string }>;
};

export default async function EquipeRapportPage({ searchParams }: PageProps) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/connexion");
  if (!canManageUsers(profile.role)) redirect("/?error=permission");

  const params = await searchParams;
  const report = await getStaffMonthlyReport(params.month);

  const loadFlash = report.loadError
    ? resolveLoadErrorToast(report.loadError, "staff")
    : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/equipe"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Équipe
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Rapport mensuel</h1>
        <p className="text-muted-foreground">
          Heures pointées par membre et solde de flexibilité actuel. Export CSV pour
          l&apos;administration.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Seules les sessions <strong>terminées</strong> comptent dans les heures du mois
          (une session en cours n&apos;apparaît pas tant qu&apos;elle n&apos;est pas clôturée).
          La colonne <strong>Solde</strong> affiche le solde de flexibilité{" "}
          <strong>actuel</strong>, pas une projection en fin de mois.
        </p>
      </div>

      {loadFlash ? <ServerNoticeToast flash={loadFlash} /> : null}

      <StaffMonthlyReportFilters monthParam={report.monthParam} />

      <StaffMonthlyReportTable rows={report.rows} monthLabel={report.monthLabel} />
    </div>
  );
}
