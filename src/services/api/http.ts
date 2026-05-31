import axios, { type AxiosError } from "axios";
import type { ApiErrorResponse, ApiSuccessResponse } from "./types";

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
  headers: {
    "Content-Type": "application/json",
  },
});

export async function getData<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  try {
    const { data } = await apiClient.get<ApiSuccessResponse<T>>(url, { params });
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
