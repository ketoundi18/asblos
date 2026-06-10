import { formatDurationMinutes } from "@/lib/data/staff-time/format-duration";
import type { ServiceHistoryDay } from "@/lib/data/staff-time/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  history: ServiceHistoryDay[];
  monthWorkedMinutes: number;
};

export function ServiceHistoryList({ history, monthWorkedMinutes }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-lg">Historique</CardTitle>
        <CardDescription>
          30 derniers jours · Ce mois : {formatDurationMinutes(monthWorkedMinutes)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun pointage pour l&apos;instant. Commence ton premier service ci-dessus.
          </p>
        ) : (
          <ul className="divide-y">
            {history.map((day) => (
              <li
                key={day.date}
                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="font-medium capitalize">{day.dateLabel}</p>
                  <p className="text-xs text-muted-foreground">
                    {day.sessionsCount}{" "}
                    {day.sessionsCount > 1 ? "sessions" : "session"}
                  </p>
                </div>
                <p className="shrink-0 font-semibold tabular-nums">
                  {formatDurationMinutes(day.totalMinutes)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
