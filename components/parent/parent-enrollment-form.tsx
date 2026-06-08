"use client";

import { ParentEnrollmentFormInner } from "@/components/parent/parent-enrollment-form-inner";
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
};

export function ParentEnrollmentForm(props: ParentEnrollmentFormProps) {
  return <ParentEnrollmentFormInner {...props} />;
}
