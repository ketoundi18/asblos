export type ParentEnrollmentState = {
  error: string | null;
  fieldErrors: Record<string, string>;
  success?: boolean;
  childId?: string;
  needsPayment?: boolean;
};

export const emptyParentEnrollmentState: ParentEnrollmentState = {
  error: null,
  fieldErrors: {},
};
