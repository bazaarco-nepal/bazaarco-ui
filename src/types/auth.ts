export type AuthIntent = "buyer" | "seller";

export type AuthProvider = "google" | "local";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  intent: AuthIntent;
  provider: AuthProvider;
  /** True after seller dashboard guide is done — do not show coachmark again. */
  onBoarding: boolean;
}

export interface RegisterPayload {
  email: string;
  name: string;
  password: string;
  intent: AuthIntent;
}

export interface PendingEmailVerification {
  email: string;
  intent: AuthIntent;
  verificationRequired: true;
  expiresAt: string;
}

export interface VerifyEmailPayload {
  email: string;
  otp: string;
}

export interface ResendEmailVerificationPayload {
  email: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UpdateProfilePayload {
  name: string;
  avatarUrl?: string | null;
}

export interface AuthSessionResponse {
  user: AuthUser;
  token: string;
}

export interface RequestPasswordResetResponse {
  email: string;
  expiresAt: string;
}

export interface ConfirmPasswordResetPayload {
  otp: string;
  newPassword: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}
