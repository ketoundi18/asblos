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
