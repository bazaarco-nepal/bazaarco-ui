export type AuthIntent = "buyer" | "seller";

export type AuthProvider = "google" | "local";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  name: string;
  avatarUrl: string | null;
  intent: AuthIntent;
  provider: AuthProvider;
  /** True after seller dashboard guide is done — do not show coachmark again. */
  onBoarding: boolean;
}

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
  intent: AuthIntent;
}

export interface LoginPayload {
  login: string;
  password: string;
}

export interface AuthSessionResponse {
  user: AuthUser;
}
