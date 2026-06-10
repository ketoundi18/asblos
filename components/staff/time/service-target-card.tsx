import { Target } from "lucide-react";
import { formatDurationMinutes } from "@/lib/data/staff-time/format-duration";
import type { ActiveContract } from "@/lib/data/staff-time/types";
import { Card, CardContent } from "@/components/ui/card";
import { getLocalTodayISO } from "@/lib/date-utils";

function getTodayDow(): number {
  const today = getLocalTodayISO();
  const [y, m, d] = today.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const dow = date.getDay();
  return dow === 0 ? 7 : dow;
}

type Props = {
  activeContract: ActiveContract | null;
  todayWorkedMinutes: number;
  /** true si la requête contrat a échoué (≠ pas de contrat) */
  contractUnavailable?: boolean;
};

export function ServiceTargetCard({
  activeContract,
  todayWorkedMinutes,
  contractUnavailable = false,
}: Props) {
  if (contractUnavailable) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center gap-3 py-4 text-sm text-muted-foreground">
          <Target className="h-4 w-4 shrink-0" aria-hidden />
          Objectif horaire temporairement indisponible — réessayez dans un instant.
        </CardContent>
      </Card>
    );
  }

  if (!activeContract) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center gap-3 py-4 text-sm text-muted-foreground">
          <Target className="h-4 w-4 shrink-0" aria-hidden />
          Objectif non défini — contacte l&apos;admin pour le configurer.
        </CardContent>
      </Card>
    );
  }

  const todayDow = getTodayDow();
  const isWorkDay = activeContract.workDays.includes(todayDow);

  if (!isWorkDay) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 py-4 text-sm text-muted-foreground">
          <Target className="h-4 w-4 shrink-0" aria-hidden />
          Pas d&apos;objectif aujourd&apos;hui — jour de repos.
        </CardContent>
      </Card>
    );
  }

  const target = activeContract.targetMinutes;
  const percent = target > 0 ? Math.min(100, Math.round((todayWorkedMinutes / target) * 100)) : 0;
  const done = todayWorkedMinutes >= target;

  return (
    <Card className={done ? "border-success-border bg-success-muted/40" : ""}>
      <CardContent className="space-y-3 py-4">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 font-medium">
            <Target className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            Objectif aujourd&apos;hui
          </span>
          <span className="tabular-nums text-muted-foreground">
            {formatDurationMinutes(todayWorkedMinutes)}{" "}
            <span className="text-foreground font-medium">
              / {formatDurationMinutes(target)}
            </span>
          </span>
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${done ? "bg-success" : "bg-primary"}`}
            style={{ width: `${percent}%` }}
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${percent}% de l'objectif atteint`}
          />
        </div>

        {done ? (
          <p className="text-xs font-medium text-success-foreground">
            Objectif atteint ! Bon travail.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Il reste {formatDurationMinutes(target - todayWorkedMinutes)} à prester.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
