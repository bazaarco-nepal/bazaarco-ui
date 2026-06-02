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

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1",
  timeout: 30_000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
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
        store.setWish([]);
        store.setWishSellers([]);
      }
    }
    return Promise.reject(error);
  },
);

export async function getData<T>(url: string, params?: Record<string, unknown>): Promise<T> {
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
