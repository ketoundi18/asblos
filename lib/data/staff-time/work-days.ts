/** Jours ISO : 1 = lundi … 7 = dimanche (aligné sur Postgres ISODOW). */

export const STAFF_WORK_DAY_OPTIONS = [
  { value: 1, label: "Lun", fullLabel: "Lundi" },
  { value: 2, label: "Mar", fullLabel: "Mardi" },
  { value: 3, label: "Mer", fullLabel: "Mercredi" },
  { value: 4, label: "Jeu", fullLabel: "Jeudi" },
  { value: 5, label: "Ven", fullLabel: "Vendredi" },
  { value: 6, label: "Sam", fullLabel: "Samedi" },
  { value: 7, label: "Dim", fullLabel: "Dimanche" },
] as const;

export const DEFAULT_STAFF_WORK_DAYS = [1, 2, 3, 4, 5];

const DAY_LABELS = Object.fromEntries(
  STAFF_WORK_DAY_OPTIONS.map((d) => [d.value, d.label])
) as Record<number, string>;

export function formatStaffWorkDays(days: number[]): string {
  const sorted = [...days].sort((a, b) => a - b);
  return sorted.map((d) => DAY_LABELS[d] ?? d).join(", ");
}
