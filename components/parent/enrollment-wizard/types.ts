import type { OpenSchoolSupportProgram } from "@/components/enrollment/school-support-enrollment-section";

export const STEP1_FIELD_KEYS = new Set([
  "first_name",
  "last_name",
  "birth_date",
  "school_name",
  "school_class",
  "allergies",
  "emergency_contact_name",
  "emergency_contact_phone",
]);

export type EnrollmentWizardProps = {
  schoolSupportFeeLabel: string;
  schoolSupportFeeCents: number;
  openPrograms: OpenSchoolSupportProgram[];
  guardianDefaults: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  mollieReady: boolean;
  simulationEnabled: boolean;
  initialStep?: string;
  initialChildId?: string;
  initialChildName?: string;
  initialSchoolSupport?: boolean;
  initialNeedsPayment?: boolean;
};

export type GuardianDefaults = EnrollmentWizardProps["guardianDefaults"];
