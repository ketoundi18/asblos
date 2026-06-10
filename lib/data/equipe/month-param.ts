import { getLocalTodayISO } from "@/lib/date-utils";

/** Mois courant au format YYYY-MM (Europe/Brussels). */
export function getCurrentMonthParam(): string {
  return getLocalTodayISO().slice(0, 7);
}

/** Valide et normalise un paramètre ?month=YYYY-MM. */
export function parseMonthParam(value: string | undefined): string {
  if (value?.match(/^\d{4}-(0[1-9]|1[0-2])$/)) return value;
  return getCurrentMonthParam();
}

export function monthStartIso(monthParam: string): string {
  return `${monthParam}-01`;
}

export function formatMonthLabel(monthParam: string): string {
  const [y, m] = monthParam.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-BE", {
    month: "long",
    year: "numeric",
  }).format(new Date(y, m - 1, 1));
}
