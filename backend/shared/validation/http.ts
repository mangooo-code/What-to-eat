import { AppError } from "../errors/AppError";
import type { HttpEvent } from "../types/api";

export function getMethod(event: HttpEvent): string {
  return (event.httpMethod ?? event.requestContext?.httpMethod ?? "").toUpperCase();
}

export function getQueryParams(event: HttpEvent): URLSearchParams {
  return new URLSearchParams(
    Object.entries(event.queryStringParameters ?? {}).filter(
      (entry): entry is [string, string] => entry[1] !== undefined,
    ),
  );
}

export function parseJsonBody<T>(event: HttpEvent): T {
  if (event.body === null || event.body === undefined) {
    throw new AppError("INVALID_REQUEST", "Request body is required");
  }
  if (typeof event.body === "object") return event.body as T;
  try {
    const source = event.isBase64Encoded
      ? Buffer.from(event.body, "base64").toString("utf8")
      : event.body;
    return JSON.parse(source) as T;
  } catch {
    throw new AppError("INVALID_JSON", "Request body must be valid JSON");
  }
}

export function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new AppError("VALIDATION_ERROR", `${field} is required`);
  }
  return value.trim();
}
