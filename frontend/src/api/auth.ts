import { makeApiGet, makeApiPost } from "./generic";

type LoginBody = {
  email: string;
  password: string;
};

type LoginResponse = {
  merchant_id: string;
  email: string;
};

type SignupBody = {
  email: string;
  password: string;
  name: string;
};

type SignupResponse = {
  id: string;
  email: string;
  name: string;
};

type MeResponse = {
  merchant_id: string;
  email: string;
};

const login = makeApiPost<LoginBody, LoginResponse>("/api/v1/auth/login");
const signup = makeApiPost<SignupBody, SignupResponse>("/api/v1/auth/signup");
const logout = makeApiPost("/api/v1/auth/logout");
const me = makeApiGet<undefined, MeResponse>("/api/v1/auth/me");

export const authApi = {
  login: (body: LoginBody) => login({ body }),
  signup: (body: SignupBody) => signup({ body }),
  logout: () => logout({}),
  me: () => me({}),
};
