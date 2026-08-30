import { AppError } from "../../../shared/errors/AppError";
import { successResponse } from "../../../shared/errors/httpResponse";
import { requireAuth } from "../../../shared/auth";
import { getUserById } from "../../../shared/database/userRepository";
import type { HttpEvent, HttpResponse } from "../../../shared/types/api";
import { getMethod } from "../../../shared/validation/http";

export async function handleUser(event: HttpEvent): Promise<HttpResponse> {
  if (getMethod(event) !== "GET") {
    throw new AppError("METHOD_NOT_ALLOWED", "Method not allowed", 405);
  }

  const userId = requireAuth(event);
  const user = await getUserById(userId);
  if (!user) throw new AppError("USER_NOT_FOUND", "User was not found", 404);

  return successResponse(user);
}
