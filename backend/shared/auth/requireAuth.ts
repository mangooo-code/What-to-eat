import jwt from "jsonwebtoken";
import { AppError } from "../errors/AppError";
import type { HttpEvent } from "../types/api";
import { getJwtSecret } from "./jwt";

export function requireAuth(event: HttpEvent): string {
  const header = event.headers?.authorization ?? event.headers?.Authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : undefined;
  if (!token) {
    throw new AppError("UNAUTHORIZED", "Authorization token is required", 401);
  }

  try {
    const payload = jwt.verify(token, getJwtSecret());
    if (typeof payload !== "object" || payload === null || typeof payload.sub !== "string") {
      throw new AppError("UNAUTHORIZED", "Invalid or expired token", 401);
    }
    return payload.sub;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("UNAUTHORIZED", "Invalid or expired token", 401);
  }
}
