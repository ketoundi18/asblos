import { ROLE_LABELS } from "@/lib/auth/roles";
import { escapeCsvCell } from "@/lib/data/equipe/escape-csv-cell";
import { formatDurationMinutes } from "@/lib/data/staff-time/format-duration";
import type { StaffMonthlyReportRow } from "@/lib/data/equipe/get-staff-monthly-report";

function formatBalanceCsv(minutes: number): string {
  if (minutes === 0) return "0";
  const abs = formatDurationMinutes(Math.abs(minutes));
  return minutes > 0 ? `+${abs}` : `-${abs}`;
}

export function buildStaffMonthlyReportCsv(
  rows: StaffMonthlyReportRow[],
  monthLabel: string
): string {
  const header = [
    "Mois",
    "Nom",
    "Rôle",
    "Heures prestées",
    "Sessions",
    "Objectif/jour",
    "Solde flexibilité",
  ];

  const lines = [
    header.join(";"),
    ...rows.map((row) =>
      [
        monthLabel,
        row.fullName,
        ROLE_LABELS[row.role],
        formatDurationMinutes(row.workedMinutes),
        String(row.sessionsCount),
        row.targetMinutesPerDay != null
          ? formatDurationMinutes(row.targetMinutesPerDay)
          : "—",
        formatBalanceCsv(row.balanceMinutes),
      ]
        .map(escapeCsvCell)
        .join(";")
    ),
  ];

  return `\uFEFF${lines.join("\r\n")}`;
}
