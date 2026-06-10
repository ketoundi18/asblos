import { ROLE_LABELS } from "@/lib/auth/roles";
import {
  formatBalanceDelta,
  formatDurationMinutes,
} from "@/lib/data/staff-time/format-duration";
import type { StaffMonthlyReportRow } from "@/lib/data/equipe/get-staff-monthly-report";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  rows: StaffMonthlyReportRow[];
  monthLabel: string;
};

export function StaffMonthlyReportTable({ rows, monthLabel }: Props) {
  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Aucun membre staff actif pour {monthLabel}.
        </CardContent>
      </Card>
    );
  }

  const totalWorked = rows.reduce((sum, row) => sum + row.workedMinutes, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle className="text-base capitalize">{monthLabel}</CardTitle>
        <Badge variant="muted" className="tabular-nums">
          Total : {formatDurationMinutes(totalWorked)}
        </Badge>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Membre</th>
              <th className="px-4 py-3 font-medium">Presté</th>
              <th className="px-4 py-3 font-medium">Sessions</th>
              <th className="px-4 py-3 font-medium">Objectif/j</th>
              <th className="px-4 py-3 font-medium">Solde</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const balancePositive = row.balanceMinutes > 0;
              const balanceNegative = row.balanceMinutes < 0;

              return (
                <tr key={row.userId} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{row.fullName}</p>
                    <p className="text-xs text-muted-foreground">{ROLE_LABELS[row.role]}</p>
                  </td>
                  <td className="px-4 py-3 tabular-nums font-medium">
                    {formatDurationMinutes(row.workedMinutes)}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">
                    {row.sessionsCount}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">
                    {row.targetMinutesPerDay != null
                      ? formatDurationMinutes(row.targetMinutesPerDay)
                      : "—"}
                  </td>
                  <td
                    className={`px-4 py-3 tabular-nums font-medium ${
                      balancePositive
                        ? "text-success"
                        : balanceNegative
                          ? "text-warning-foreground"
                          : ""
                    }`}
                  >
                    {row.balanceMinutes === 0
                      ? "À jour"
                      : formatBalanceDelta(row.balanceMinutes)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
