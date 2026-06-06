export type ActivityFormState = {
  error: string | null;
  fieldErrors: Record<string, string>;
};

export const emptyActivityFormState: ActivityFormState = {
  error: null,
  fieldErrors: {},
};
