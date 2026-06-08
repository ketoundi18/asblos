export type ParentEnrollmentState = {
  error: string | null;
  fieldErrors: Record<string, string>;
  success?: boolean;
  childId?: string;
  childFirstName?: string;
  needsPayment?: boolean;
  schoolSupport?: boolean;
  /** Inscription enfant OK, mais programme/créneaux à finaliser plus tard */
  enrollmentWarning?: string;
};

export const emptyParentEnrollmentState: ParentEnrollmentState = {
  error: null,
  fieldErrors: {},
};
