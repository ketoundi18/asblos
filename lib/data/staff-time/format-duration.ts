/** Affiche une variation de solde : "+2 h 30", "−45 min". */
export function formatBalanceDelta(minutes: number): string {
  if (minutes === 0) return "0 min";
  const abs = formatDurationMinutes(Math.abs(minutes));
  return minutes > 0 ? `+${abs}` : `−${abs}`;
}

/** Affiche une durée en minutes : "2 h 30", "45 min". */
export function formatDurationMinutes(totalMinutes: number): string {
  const safe = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(safe / 60);
  const minutes = safe % 60;

  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} h`;
  return `${hours} h ${minutes}`;
}

/** Horloge en direct pendant un service ouvert. */
export function formatElapsedSince(startedAt: string, nowMs = Date.now()): string {
  const startMs = new Date(startedAt).getTime();
  const totalSec = Math.max(0, Math.floor((nowMs - startMs) / 1000));
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  if (hours > 0) {
    return `${hours} h ${String(minutes).padStart(2, "0")} min`;
  }
  return `${minutes} min ${String(seconds).padStart(2, "0")} s`;
}
