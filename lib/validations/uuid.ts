import { redirect } from "next/navigation";

export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

/** Redirige si l'identifiant n'est pas un UUID valide. */
export function guardUuid(id: string, fallbackPath: string): string {
  if (!isValidUuid(id)) {
    redirect(`${fallbackPath}?error=not-found`);
  }
  return id;
}

/** Redirige si l'identifiant enfant n'est pas un UUID valide. */
export function guardChildId(childId: string, fallbackPath = "/enfants"): string {
  return guardUuid(childId, fallbackPath);
}
