import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { canExportReports } from "@/lib/auth/permissions";
import { buildStaffMonthlyReportCsv } from "@/lib/data/equipe/build-staff-monthly-report-csv";
import { getStaffMonthlyReport } from "@/lib/data/equipe/get-staff-monthly-report";

export async function GET(request: Request) {
  const profile = await getCurrentProfile();

  if (!profile || !profile.is_active || !canExportReports(profile.role)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const report = await getStaffMonthlyReport(searchParams.get("month") ?? undefined);

  if (report.loadError) {
    return NextResponse.json(
      { error: "Impossible de charger le rapport." },
      { status: report.loadError === "migration_required" ? 503 : 500 }
    );
  }

  const csv = buildStaffMonthlyReportCsv(report.rows, report.monthLabel);
  const filename = `asblos-rapport-equipe-${report.monthParam}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
