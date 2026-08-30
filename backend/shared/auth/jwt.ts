import { AppError } from "../errors/AppError";

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw new AppError("JWT_SECRET_NOT_CONFIGURED", "JWT_SECRET is not configured", 500);
  }
  return secret;
}
