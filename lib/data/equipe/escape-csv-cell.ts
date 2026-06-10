/**
 * Échappe une cellule CSV (séparateur ; pour Excel BE).
 * Neutralise l'injection de formules (= + - @) à l'ouverture dans Excel/LibreOffice.
 */
export function escapeCsvCell(value: string): string {
  let cell = value;

  if (/^[=+\-@]/.test(cell)) {
    cell = `'${cell}`;
  }

  if (/[",\n\r]/.test(cell)) {
    return `"${cell.replace(/"/g, '""')}"`;
  }

  return cell;
}
