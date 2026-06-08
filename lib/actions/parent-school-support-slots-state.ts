export type ParentSlotSelectionState = {
  error: string | null;
  fieldErrors: Record<string, string>;
  success?: boolean;
};

export const emptyParentSlotSelectionState: ParentSlotSelectionState = {
  error: null,
  fieldErrors: {},
};
