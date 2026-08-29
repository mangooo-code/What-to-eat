import { AppError } from "../errors/AppError";
import type { HttpEvent } from "../types/api";

export interface AuthContext {
  userId: string;
  token: string;
}

export interface TokenVerifier {
  verify(token: string): Promise<{ userId: string }>;
}

export async function requireAuth(event: HttpEvent, verifier: TokenVerifier): Promise<AuthContext> {
  const authorization = Object.entries(event.headers ?? {}).find(
    ([key]) => key.toLowerCase() === "authorization",
  )?.[1];
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  if (!match) throw new AppError("UNAUTHENTICATED", "Authentication is required", 401);

  const token = match[1];
  const identity = await verifier.verify(token);
  return { userId: identity.userId, token };
}
