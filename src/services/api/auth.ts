import axios from "axios";

import type { AuthSessionResponse, AuthUser, LoginPayload, RegisterPayload } from "@/types/auth";
import type { ApiSuccessResponse } from "./types";
import { ApiRequestError } from "./http";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1";

const authClient = axios.create({
  baseURL: apiBase,
  timeout: 30_000,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

function mapAuthError(error: unknown): ApiRequestError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 500;
    const body = error.response?.data as { message?: string; errors?: string[] } | undefined;
    return new ApiRequestError(
      body?.message ?? error.message ?? "Request failed",
      status,
      body?.errors ?? [],
    );
  }
  if (error instanceof Error) {
    return new ApiRequestError(error.message, 500);
  }
  return new ApiRequestError("Request failed", 500);
}

export function getGoogleLoginUrl(intent: "buyer" | "seller" = "buyer"): string {
  const params = new URLSearchParams({ intent });
  return `${apiBase}/auth/google?${params.toString()}`;
}

export async function register(payload: RegisterPayload): Promise<AuthUser> {
  try {
    const { data } = await authClient.post<ApiSuccessResponse<AuthSessionResponse>>(
      "/auth/register",
      payload,
    );
    return data.data.user;
  } catch (error) {
    throw mapAuthError(error);
  }
}

export async function login(payload: LoginPayload): Promise<AuthUser> {
  try {
    const { data } = await authClient.post<ApiSuccessResponse<AuthSessionResponse>>(
      "/auth/login",
      payload,
    );
    return data.data.user;
  } catch (error) {
    throw mapAuthError(error);
  }
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  try {
    const { data } = await authClient.get<ApiSuccessResponse<AuthUser>>("/auth/me");
    return data.data;
  } catch (error) {
    throw mapAuthError(error);
  }
}

export async function logout(): Promise<void> {
  try {
    await authClient.post("/auth/logout");
  } catch (error) {
    throw mapAuthError(error);
  }
}
