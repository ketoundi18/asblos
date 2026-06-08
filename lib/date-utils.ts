/** Date/heure en fuseau local (Belgique) — évite les décalages UTC. */

const TIMEZONE = "Europe/Brussels";

/** Aujourd'hui au format YYYY-MM-DD (heure locale). */
export function getLocalTodayISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Ajoute N jours à une date ISO locale (YYYY-MM-DD). */
export function addDaysToIso(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Extrait HH:MM depuis une valeur TIME Postgres ou input HTML. */
export function normalizeTimeValue(time: string | null | undefined): string | null {
  if (!time?.trim()) return null;
  const match = time.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** Pour enregistrement en base (TIME Postgres). */
export function normalizeTimeForDb(time: string | null | undefined): string | null {
  const normalized = normalizeTimeValue(time);
  if (!normalized) return null;
  return `${normalized}:00`;
}

/** Affichage parent/staff : 14h30 */
export function formatActivityTimeDisplay(time: string | null | undefined): string {
  const normalized = normalizeTimeValue(time);
  if (!normalized) return "";
  const [h, m] = normalized.split(":");
  return `${h}h${m}`;
}

export function formatActivityTimeRange(
  start: string | null | undefined,
  end: string | null | undefined
): string {
  const startLabel = formatActivityTimeDisplay(start);
  const endLabel = formatActivityTimeDisplay(end);
  if (startLabel && endLabel) return `${startLabel} – ${endLabel}`;
  return startLabel || endLabel;
}

/** Minutes depuis minuit pour comparer deux heures. */
export function timeToMinutes(time: string | null | undefined): number | null {
  const normalized = normalizeTimeValue(time);
  if (!normalized) return null;
  const [h, m] = normalized.split(":").map(Number);
  return h * 60 + m;
}

export function isEndTimeAfterStart(
  start: string | null | undefined,
  end: string | null | undefined
): boolean {
  const startMin = timeToMinutes(start);
  const endMin = timeToMinutes(end);
  if (startMin === null || endMin === null) return true;
  return endMin > startMin;
}
