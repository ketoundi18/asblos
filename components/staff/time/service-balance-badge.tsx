import { formatDurationMinutes } from "@/lib/data/staff-time/format-duration";

type Props = {
  balanceMinutes: number;
  /** true si la requête solde a échoué */
  unavailable?: boolean;
};

export function ServiceBalanceBadge({ balanceMinutes, unavailable = false }: Props) {
  if (unavailable) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Solde de flexibilité
        </p>
        <p className="mt-1 text-lg font-semibold text-muted-foreground">Indisponible</p>
      </div>
    );
  }

  const positive = balanceMinutes > 0;
  const negative = balanceMinutes < 0;
  const absLabel = formatDurationMinutes(Math.abs(balanceMinutes));

  let message: string;
  if (balanceMinutes === 0) {
    message = "Solde à jour";
  } else if (positive) {
    message = `+${absLabel} de flexibilité`;
  } else {
    message = `${absLabel} à rattraper`;
  }

  return (
    <div
      className={`rounded-xl border px-4 py-3 text-center ${
        positive
          ? "border-success-border bg-success-muted/40"
          : negative
            ? "border-warning-border bg-warning-muted/40"
            : "border-border bg-muted/30"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Solde de flexibilité
      </p>
      <p
        className={`mt-1 text-lg font-semibold ${
          positive
            ? "text-success-foreground"
            : negative
              ? "text-warning-foreground"
              : ""
        }`}
      >
        {message}
      </p>
    </div>
  );
}
