/** Utilitaires tarifs — sans import serveur (utilisable côté client). */

import type { MembershipPlan } from "@/types/school-support";

export type AsblSettingsSnapshot = {
  id: string;
  school_year: string;
  enrollment_fee_cents: number;
  school_support_fee_cents: number;
  currency: string;
};

export type EnrollmentQuoteLine = {
  code: "BASE" | "SCHOOL_SUPPORT";
  label: string;
  cents: number;
};

export type EnrollmentQuote = {
  lines: EnrollmentQuoteLine[];
  totalCents: number;
  needsPayment: boolean;
  membershipPlan: MembershipPlan;
  membershipStatus: "AWAITING_PAYMENT" | "AWAITING_ASBL";
  enrollmentStatus: "EN_ATTENTE_PAIEMENT" | "PAYE_EN_ATTENTE_ASBL";
};

export function getSchoolSupportFeeCents(
  settings: AsblSettingsSnapshot | null
): number {
  if (!settings) return 0;
  return settings.school_support_fee_cents ?? settings.enrollment_fee_cents ?? 0;
}

export function formatEnrollmentFeeLabel(cents: number): string {
  if (cents <= 0) return "Gratuit";
  return new Intl.NumberFormat("fr-BE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export function buildEnrollmentQuote(
  plan: MembershipPlan,
  settings: AsblSettingsSnapshot | null
): EnrollmentQuote {
  const supportFeeCents =
    plan === "SCHOOL_SUPPORT" ? getSchoolSupportFeeCents(settings) : 0;

  const lines: EnrollmentQuoteLine[] = [
    { code: "BASE", label: "Inscription ASBL", cents: 0 },
  ];

  if (plan === "SCHOOL_SUPPORT") {
    lines.push({
      code: "SCHOOL_SUPPORT",
      label: "Soutien scolaire (annuel)",
      cents: supportFeeCents,
    });
  }

  const totalCents = lines.reduce((sum, line) => sum + line.cents, 0);
  const needsPayment = plan === "SCHOOL_SUPPORT" && totalCents > 0;

  return {
    lines,
    totalCents,
    needsPayment,
    membershipPlan: plan,
    membershipStatus: needsPayment ? "AWAITING_PAYMENT" : "AWAITING_ASBL",
    enrollmentStatus: needsPayment ? "EN_ATTENTE_PAIEMENT" : "PAYE_EN_ATTENTE_ASBL",
  };
}

export function parseMembershipPlan(raw: FormDataEntryValue | null): MembershipPlan {
  return typeof raw === "string" && raw === "SCHOOL_SUPPORT" ? "SCHOOL_SUPPORT" : "BASE";
}

export function parseSelectedSlotIds(formData: FormData): string[] {
  return formData
    .getAll("school_support_slot_ids")
    .filter((value): value is string => typeof value === "string" && value.length > 0);
}

export function parseProgramId(raw: FormDataEntryValue | null): string | null {
  if (typeof raw !== "string" || raw.trim() === "") return null;
  return raw.trim();
}

export type StaffEnrollmentQuote = Omit<
  EnrollmentQuote,
  "membershipStatus" | "enrollmentStatus"
> & {
  membershipStatus: "ACTIVE" | "AWAITING_PAYMENT" | "AWAITING_ASBL";
  enrollmentStatus: "VALIDE" | "EN_ATTENTE_PAIEMENT" | "PAYE_EN_ATTENTE_ASBL";
};

/** Quote pour inscription manuelle par le staff (validation sur place). */
export function buildStaffEnrollmentQuote(
  plan: MembershipPlan,
  settings: AsblSettingsSnapshot | null,
  paymentReceived: boolean
): StaffEnrollmentQuote {
  const base = buildEnrollmentQuote(plan, settings);

  if (plan === "BASE") {
    return {
      ...base,
      membershipStatus: "ACTIVE",
      enrollmentStatus: "VALIDE",
    };
  }

  if (base.totalCents > 0 && !paymentReceived) {
    return {
      ...base,
      membershipStatus: "AWAITING_PAYMENT",
      enrollmentStatus: "EN_ATTENTE_PAIEMENT",
    };
  }

  return {
    ...base,
    membershipStatus: "ACTIVE",
    enrollmentStatus: "VALIDE",
  };
}
