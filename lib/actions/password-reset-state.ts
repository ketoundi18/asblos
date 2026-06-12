export type ForgotPasswordState = {
  error: string | null;
  success: boolean;
  message?: string;
  fieldErrors: {
    email?: string;
  };
};

export const initialForgotPasswordState: ForgotPasswordState = {
  error: null,
  success: false,
  fieldErrors: {},
};

export type ResetPasswordState = {
  error: string | null;
  success: boolean;
  fieldErrors: Record<string, string>;
};

export const initialResetPasswordState: ResetPasswordState = {
  error: null,
  success: false,
  fieldErrors: {},
};
