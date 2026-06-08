"use client";

import { ParentEnrollmentWizard } from "@/components/parent/parent-enrollment-wizard";
import type { OpenSchoolSupportProgram } from "@/components/enrollment/school-support-enrollment-section";

type ParentEnrollmentFormProps = {
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

export function ParentEnrollmentForm(props: ParentEnrollmentFormProps) {
  return <ParentEnrollmentWizard {...props} />;
}
