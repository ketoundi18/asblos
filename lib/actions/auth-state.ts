export type LoginActionState = {
  error: string | null;
  fieldErrors: {
    email?: string;
    password?: string;
  };
};

export const initialLoginState: LoginActionState = {
  error: null,
  fieldErrors: {},
};

export type ParentSignupState = {
  error: string | null;
  success: boolean;
  fieldErrors: Record<string, string>;
};

export const initialParentSignupState: ParentSignupState = {
  error: null,
  success: false,
  fieldErrors: {},
};
