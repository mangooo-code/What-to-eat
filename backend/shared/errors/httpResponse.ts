import { AppError } from "./AppError";
import type { ApiResponse, HttpResponse } from "../types/api";

const headers = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "Content-Type, Authorization",
  "access-control-allow-methods": "GET, POST, PATCH, DELETE, OPTIONS",
};

export function corsPreflightResponse(): HttpResponse {
  return { statusCode: 204, headers, body: "" };
}

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
