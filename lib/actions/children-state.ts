export type ChildFormState = {
  error: string | null;
  fieldErrors: Record<string, string>;
  enrollmentWarning?: string;
};

export const emptyFormState: ChildFormState = {
  error: null,
  fieldErrors: {},
};
