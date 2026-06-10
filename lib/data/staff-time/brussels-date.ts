const TIMEZONE = "Europe/Brussels";

/** Date locale Belgique au format YYYY-MM-DD depuis un ISO instant. */
export function getBrusselsDateIso(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

/** Début du mois courant (YYYY-MM-DD) en fuseau Belgique. */
export function getBrusselsMonthStartIso(iso: string): string {
  const [y, m] = getBrusselsDateIso(iso).split("-");
  return `${y}-${m}-01`;
}

/**
 * Borne basse sûre pour .gte("started_at") — couvre minuit Bruxelles (CET/CEST).
 * On charge la veille 22h UTC max ; le filtre par date locale reste côté app.
 */
export function getBrusselsDayStartQueryInstant(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d - 1, 22, 0, 0));
  return utc.toISOString();
}

export function formatBrusselsDateLabel(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-BE", {
    timeZone: TIMEZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(y, m - 1, d));
}
