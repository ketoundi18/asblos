export type CreateStaffMemberState = {
  error: string | null;
  fieldErrors: Record<string, string>;
};

export const initialCreateStaffMemberState: CreateStaffMemberState = {
  error: null,
  fieldErrors: {},
};

export type UpsertStaffContractState = {
  error: string | null;
  fieldErrors: Record<string, string>;
};

export const initialUpsertStaffContractState: UpsertStaffContractState = {
  error: null,
  fieldErrors: {},
};
