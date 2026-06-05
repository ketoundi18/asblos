export type UserRole = "ADMIN" | "TRAVAILLEUR" | "STAGIAIRE" | "BENEVOLE";

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrateur",
  TRAVAILLEUR: "Travailleur",
  STAGIAIRE: "Stagiaire",
  BENEVOLE: "Bénévole",
};

export function isUserRole(value: string): value is UserRole {
  return ["ADMIN", "TRAVAILLEUR", "STAGIAIRE", "BENEVOLE"].includes(value);
}
