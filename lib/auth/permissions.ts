import type { UserRole } from "@/lib/auth/roles";
import { isParentRole, isStaffRole } from "@/lib/auth/roles";

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  phone?: string | null;
  signup_source?: string | null;
  created_at: string;
  updated_at: string;
};

export { isStaffRole, isParentRole };

/** ADMIN et TRAVAILLEUR : gestion complète */
export function isStaffFullAccess(role: UserRole): boolean {
  return role === "ADMIN" || role === "TRAVAILLEUR";
}

/** BÉNÉVOLE et STAGIAIRE : consultation limitée + présences */
export function isStaffLimitedAccess(role: UserRole): boolean {
  return role === "BENEVOLE" || role === "STAGIAIRE";
}

export function canManageUsers(role: UserRole): boolean {
  return role === "ADMIN";
}

export function canExportReports(role: UserRole): boolean {
  return role === "ADMIN";
}

/** Export RGPD + anonymisation enfant — réservé admin. */
export function canManageChildGdpr(role: UserRole): boolean {
  return role === "ADMIN";
}

export function canModifyChild(role: UserRole): boolean {
  return isStaffFullAccess(role);
}

export function canCreateChild(role: UserRole): boolean {
  return isStaffFullAccess(role);
}

export function canDeleteChild(role: UserRole): boolean {
  return role === "ADMIN";
}

export function canManageActivities(role: UserRole): boolean {
  return isStaffFullAccess(role);
}

export function canRegisterChildToActivity(role: UserRole): boolean {
  return isStaffFullAccess(role);
}

export function canMarkAttendance(role: UserRole): boolean {
  return isStaffFullAccess(role) || isStaffLimitedAccess(role);
}

export function canRecordPayment(role: UserRole): boolean {
  return isStaffFullAccess(role);
}

export function canViewFullChildProfile(role: UserRole): boolean {
  return isStaffFullAccess(role);
}

export function canViewChildrenList(role: UserRole): boolean {
  return isStaffFullAccess(role) || isStaffLimitedAccess(role);
}

export function canViewActivities(role: UserRole): boolean {
  return isStaffFullAccess(role) || isStaffLimitedAccess(role);
}

/** Pointage horaire — TRAVAILLEUR, STAGIAIRE, BENEVOLE (pas ADMIN en V1). */
export function canClockStaffTime(role: UserRole): boolean {
  return (
    role === "TRAVAILLEUR" ||
    role === "STAGIAIRE" ||
    role === "BENEVOLE"
  );
}
