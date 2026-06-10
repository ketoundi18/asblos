const PREFIX = "asblos-toast:";
const DEFAULT_TTL_MS = 10_000;

export function buildToastDedupeKey(parts: (string | undefined | null)[]): string {
  return parts.filter(Boolean).join("|");
}

/** True si le toast doit s'afficher ; enregistre l'horodatage en sessionStorage (anti-doublon HMR). */
export function claimToastDisplay(key: string, ttlMs = DEFAULT_TTL_MS): boolean {
  if (typeof window === "undefined") return true;

  try {
    const storageKey = PREFIX + key;
    const raw = sessionStorage.getItem(storageKey);
    const now = Date.now();

    if (raw) {
      const ts = Number(raw);
      if (!Number.isNaN(ts) && now - ts < ttlMs) {
        return false;
      }
    }

    sessionStorage.setItem(storageKey, String(now));
    return true;
  } catch {
    return true;
  }
}
