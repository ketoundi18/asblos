import {
  formatBalanceDelta,
  formatDurationMinutes,
} from "@/lib/data/staff-time/format-duration";
import type { ServiceLedgerMovement } from "@/lib/data/staff-time/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  movements: ServiceLedgerMovement[];
  balanceMinutes: number;
  ledgerUnavailable?: boolean;
  balanceUnavailable?: boolean;
};

function formatBalanceLabel(balanceMinutes: number): string {
  if (balanceMinutes === 0) return "à jour";
  if (balanceMinutes > 0) {
    return `+${formatDurationMinutes(balanceMinutes)} d'avance`;
  }
  return `${formatDurationMinutes(Math.abs(balanceMinutes))} à rattraper`;
}

export function ServiceLedgerList({
  movements,
  balanceMinutes,
  ledgerUnavailable = false,
  balanceUnavailable = false,
}: Props) {
  const balanceLabel = balanceUnavailable
    ? "indisponible"
    : formatBalanceLabel(balanceMinutes);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Mouvements du solde</CardTitle>
        <CardDescription>
          Chaque nuit, tes heures pointées sont comparées à l&apos;objectif (tolérance 5 min).
          Solde actuel :{" "}
          <span className="font-medium text-foreground">{balanceLabel}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {ledgerUnavailable ? (
          <p className="text-sm text-muted-foreground">
            L&apos;historique du solde est temporairement indisponible. Le pointage reste actif.
          </p>
        ) : movements.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun mouvement pour l&apos;instant. Le solde se met à jour après tes pointages,
            chaque nuit ou au prochain « Commencer mon service ».
          </p>
        ) : (
          <ul className="divide-y">
            {movements.map((movement) => {
              const positive = movement.deltaMinutes > 0;
              const negative = movement.deltaMinutes < 0;

              return (
                <li
                  key={movement.id}
                  className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="font-medium capitalize">{movement.referenceDateLabel}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{movement.label}</p>
                  </div>
                  <p
                    className={`shrink-0 font-semibold tabular-nums ${
                      positive
                        ? "text-success"
                        : negative
                          ? "text-warning-foreground"
                          : ""
                    }`}
                  >
                    {formatBalanceDelta(movement.deltaMinutes)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
