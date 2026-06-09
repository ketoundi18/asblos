import type { OpenSchoolSupportProgram } from "@/components/enrollment/school-support-enrollment-section";
import type { ChildWithGuardians } from "@/types/child";

export type ChildFormState = {
  error: string | null;
  fieldErrors: Record<string, string>;
  success?: boolean;
  enrollmentWarning?: string;
};

export type EnrollmentOptions = {
  programs: OpenSchoolSupportProgram[];
  schoolSupportFeeCents: number;
  schoolSupportFeeLabel: string;
  mode: "parent" | "staff";
};

export type GuardianDefaults = {
  relation?: "MERE" | "PERE" | "TUTEUR" | "AUTRE";
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
};

export type ChildFormProps = {
  action: (state: ChildFormState, formData: FormData) => Promise<ChildFormState>;
  initialState: ChildFormState;
  child?: ChildWithGuardians;
  submitLabel: string;
  /** @deprecated Préfère variant="staff" | "parent" */
  showInternalFields?: boolean;
  variant?: "staff" | "parent";
  cancelHref?: string;
  guardianDefaults?: GuardianDefaults;
  /** Bloc adhésion / soutien scolaire (création uniquement) */
  enrollment?: EnrollmentOptions;
};

export type GuardianFieldValues = {
  relation: "MERE" | "PERE" | "TUTEUR" | "AUTRE";
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  canPickup: boolean;
};
