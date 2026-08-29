import { AppError } from "../errors/AppError";

/**
 * Temporary Phase 1B identity boundary. Replace this helper with requireAuth
 * when real CloudBase authentication is connected.
 */
export function getDevelopmentUserId(env: NodeJS.ProcessEnv = process.env): string {
  const userId = env.DEV_USER_ID?.trim();
  if (!userId) {
    throw new AppError("DEVELOPMENT_USER_NOT_CONFIGURED", "DEV_USER_ID is not configured", 500);
  }
  return userId;
}
