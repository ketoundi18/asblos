import type { UserRole } from "@/lib/auth/roles";

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export function canManageUsers(role: UserRole): boolean {
  return role === "ADMIN";
}

export function canExportReports(role: UserRole): boolean {
  return role === "ADMIN";
}

export function canModifyChild(role: UserRole): boolean {
  return role === "ADMIN" || role === "TRAVAILLEUR" || role === "STAGIAIRE";
}

export function canCreateChild(role: UserRole): boolean {
  return role === "ADMIN" || role === "TRAVAILLEUR";
}

export function canDeleteChild(role: UserRole): boolean {
  return role === "ADMIN";
}

export function canManageActivities(role: UserRole): boolean {
  return role === "ADMIN" || role === "TRAVAILLEUR";
}

export function canRegisterChild(role: UserRole): boolean {
  return role === "ADMIN" || role === "TRAVAILLEUR" || role === "STAGIAIRE";
}

export function canMarkAttendance(): boolean {
  return true;
}

export function canRecordPayment(role: UserRole): boolean {
  return role === "ADMIN" || role === "TRAVAILLEUR";
}

export function canViewFullChildProfile(role: UserRole): boolean {
  return role !== "BENEVOLE";
}
