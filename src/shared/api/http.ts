import axios, { type AxiosError } from "axios";
import type { ApiErrorResponse, ApiSuccessResponse } from "./types";
import { clearAccessToken, getAccessToken } from "@/shared/lib/auth-token";
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

/**
 * `throwOnError` predicate for CRITICAL React Query reads (catalog, product,
 * cart). Lets the error propagate to the nearest error boundary — which shows
 * the maintenance screen — on a real outage (5xx/network), but NOT on 401
 * (handled by the auth flow) or 404 (handled as not-found). Minor widgets must
 * NOT use this; they keep their soft empty states.
 */
export function throwOnCriticalError(error: Error): boolean {
  return !(error instanceof ApiRequestError && (error.status === 401 || error.status === 404));
}

/** Same-origin API base for JSON calls (via Next.js /api/v1 rewrite). */
export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1";
}

/**
 * Same-origin base for browser multipart uploads. Uploads go through the
 * /api/v1/media/upload/[type] route handler (which streams to the Core API),
 * so the httpOnly session cookie rides along — a direct cross-origin call to the
 * API host loses that cookie and fails with "Not authenticated".
 */
export function getUploadApiBaseUrl(): string {
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

uploadClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(mapApiError(error)),
);

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
