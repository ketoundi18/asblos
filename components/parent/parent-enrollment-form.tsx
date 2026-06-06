"use client";

import { ParentEnrollmentFormInner } from "@/components/parent/parent-enrollment-form-inner";

type ParentEnrollmentFormProps = {
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
