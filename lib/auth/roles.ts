export type UserRole =
  | "ADMIN"
  | "TRAVAILLEUR"
  | "STAGIAIRE"
  | "BENEVOLE"
  | "PARENT";

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrateur",
  TRAVAILLEUR: "Travailleur",
  STAGIAIRE: "Stagiaire",
  BENEVOLE: "Bénévole",
  PARENT: "Parent",
};

export function isUserRole(value: string): value is UserRole {
  return [
    "ADMIN",
    "TRAVAILLEUR",
    "STAGIAIRE",
    "BENEVOLE",
    "PARENT",
  ].includes(value);
}

export function isParentRole(role: UserRole): boolean {
  return role === "PARENT";
}

export function isStaffRole(role: UserRole): boolean {
  return role !== "PARENT";
}
