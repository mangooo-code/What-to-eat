import { AppError } from "./AppError";
import type { ApiResponse, HttpResponse } from "../types/api";

const headers = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

export function successResponse<T>(data: T, statusCode = 200): HttpResponse {
  const payload: ApiResponse<T> = { success: true, data };
  return { statusCode, headers, body: JSON.stringify(payload) };
}

export function errorResponse(error: unknown): HttpResponse {
  const appError = error instanceof AppError
    ? error
    : new AppError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  const payload: ApiResponse<never> = {
    success: false,
    error: { code: appError.code, message: appError.message },
  };
  return { statusCode: appError.statusCode, headers, body: JSON.stringify(payload) };
}
