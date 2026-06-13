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
  bankTransferConfigured: boolean;
  initialStep?: string;
  initialChildId?: string;
  initialChildName?: string;
  initialSchoolSupport?: boolean;
  initialNeedsPayment?: boolean;
};

export type GuardianDefaults = EnrollmentWizardProps["guardianDefaults"];

export type Step1Draft = {
  first_name: string;
  last_name: string;
  birth_date: string;
  school_name: string;
  school_class: string;
  allergies: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  image_rights: boolean;
  outing_authorization: boolean;
};
