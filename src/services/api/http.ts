import axios, { type AxiosError } from "axios";
import type { ApiErrorResponse, ApiSuccessResponse } from "./types";
import { clearAccessToken, getAccessToken } from "@/lib/auth-token";
import { useBazaarStore } from "@/store/bazaar-store";

export class ApiRequestError extends Error {
  readonly status: number;
  readonly errors: string[];

  constructor(message: string, status: number, errors: string[] = []) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.errors = errors;
  }
}

/** Same-origin API base for JSON calls (via Next.js /api/v1 rewrite). */
export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1";
}

/**
 * Direct Core API base for browser multipart uploads.
 * Next.js dev rewrites buffer large bodies and often abort mid-upload; hit the
 * API host directly when NEXT_PUBLIC_BACKEND_URL is set (local dev + prod).
 */
export function getUploadApiBaseUrl(): string {
  const backend = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();
  if (backend) {
    return `${backend.replace(/\/$/, "")}/api/v1`;
  }
  return getApiBaseUrl();
}

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30_000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    // UI locale (ne/en) is display-only. Always tell the API to use English so
    // query params, error messages and responses are never locale-sensitive.
    "Accept-Language": "en",
  },
});

/** Multipart uploads — direct to Core API, long timeouts set per request. */
export const uploadClient = axios.create({
  baseURL: getUploadApiBaseUrl(),
  withCredentials: true,
  headers: {
    "Accept-Language": "en",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

uploadClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// An expired/invalid session surfaced mid-session (e.g. cookie expiry) should
// drop the app back to guest state. AuthRoleGuard then bounces protected pages
// to sign-in. The /auth/me probe uses a separate client, so guest loads stay quiet.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const store = useBazaarStore.getState();
      if (store.authed) {
        clearAccessToken();
        store.setAuthed(false);
        store.setUser(null);
        store.setCart([]);
        store.setSavedProducts([]);
        store.setSavedSellers([]);
      }
    }
    return Promise.reject(error);
  },
);

export async function getData<T>(url: string, params?: object): Promise<T> {
  try {
    const { data } = await apiClient.get<ApiSuccessResponse<T>>(url, { params });
    return data.data;
  } catch (error) {
    throw mapApiError(error);
  }
}

export async function postData<T>(url: string, body?: unknown): Promise<T> {
  try {
    const { data } = await apiClient.post<ApiSuccessResponse<T>>(url, body);
    return data.data;
  } catch (error) {
    throw mapApiError(error);
  }
}

export async function patchData<T>(url: string, body?: unknown): Promise<T> {
  try {
    const { data } = await apiClient.patch<ApiSuccessResponse<T>>(url, body);
    return data.data;
  } catch (error) {
    throw mapApiError(error);
  }
}

export async function deleteData<T>(url: string): Promise<T> {
  try {
    const { data } = await apiClient.delete<ApiSuccessResponse<T>>(url);
    return data.data;
  } catch (error) {
    throw mapApiError(error);
  }
}

function mapApiError(error: unknown): ApiRequestError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const status = axiosError.response?.status ?? 500;
    const body = axiosError.response?.data;
    return new ApiRequestError(
      body?.message ?? axiosError.message ?? "Request failed",
      status,
      body?.errors ?? [],
    );
  }
  if (error instanceof Error) {
    return new ApiRequestError(error.message, 500);
  }
  return new ApiRequestError("Request failed", 500);
}
