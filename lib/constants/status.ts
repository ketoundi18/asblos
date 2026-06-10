/** Constantes alignées sur les enums Postgres (types/database.ts). */

export const MEMBERSHIP_STATUS = {
  AWAITING_PAYMENT: "AWAITING_PAYMENT",
  AWAITING_ASBL: "AWAITING_ASBL",
  ACTIVE: "ACTIVE",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
} as const;

export type MembershipStatus =
  (typeof MEMBERSHIP_STATUS)[keyof typeof MEMBERSHIP_STATUS];

export const MEMBERSHIP_PLAN = {
  BASE: "BASE",
  SCHOOL_SUPPORT: "SCHOOL_SUPPORT",
} as const;

export type MembershipPlan =
  (typeof MEMBERSHIP_PLAN)[keyof typeof MEMBERSHIP_PLAN];

export const CHILD_ENROLLMENT_STATUS = {
  BROUILLON: "BROUILLON",
  EN_ATTENTE_PAIEMENT: "EN_ATTENTE_PAIEMENT",
  PAYE_EN_ATTENTE_ASBL: "PAYE_EN_ATTENTE_ASBL",
  VALIDE: "VALIDE",
  REFUSE: "REFUSE",
} as const;

export type ChildEnrollmentStatus =
  (typeof CHILD_ENROLLMENT_STATUS)[keyof typeof CHILD_ENROLLMENT_STATUS];

export const SCHOOL_SUPPORT_ENROLLMENT_STATUS = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  CANCELLED: "CANCELLED",
} as const;

export type SchoolSupportEnrollmentStatus =
  (typeof SCHOOL_SUPPORT_ENROLLMENT_STATUS)[keyof typeof SCHOOL_SUPPORT_ENROLLMENT_STATUS];

export const CHILD_STATUS = {
  ACTIF: "ACTIF",
  INACTIF: "INACTIF",
  ARCHIVE: "ARCHIVE",
} as const;

export type ChildStatus = (typeof CHILD_STATUS)[keyof typeof CHILD_STATUS];

export const ACTIVITY_STATUS = {
  PLANIFIEE: "PLANIFIEE",
  EN_COURS: "EN_COURS",
  TERMINEE: "TERMINEE",
  ANNULEE: "ANNULEE",
} as const;

export type ActivityStatus =
  (typeof ACTIVITY_STATUS)[keyof typeof ACTIVITY_STATUS];
