import { AppError } from "../../../shared/errors/AppError";
import { successResponse } from "../../../shared/errors/httpResponse";
import type { HttpEvent, HttpResponse } from "../../../shared/types/api";
import { parseJsonBody, requireString } from "../../../shared/validation/http";
import { authenticate, buildBearerToken } from "../helpers/AuthenticationHelper";
import type { LoginRequest } from "../contracts";

export async function handleLogin(event: HttpEvent): Promise<HttpResponse> {
  const body = parseJsonBody<LoginRequest>(event);
  const phoneNumber = requireString(body.phoneNumber, "phoneNumber");
  const password = requireString(body.password, "password");
  const user = await authenticate(phoneNumber, password);
  if (!user) {
    throw new AppError("INVALID_CREDENTIALS", "Phone number or password is incorrect", 401);
  }
  return successResponse(buildBearerToken(user));
}
