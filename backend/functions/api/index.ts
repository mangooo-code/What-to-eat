import { AppError } from "../../shared/errors/AppError";
import { errorResponse, successResponse } from "../../shared/errors/httpResponse";
import type { HttpEvent, HttpResponse } from "../../shared/types/api";
import { getMethod, parseJsonBody, requireString } from "../../shared/validation/http";
import { authenticate, buildBearerToken } from "./helpers/AuthenticationHelper";
import type { LoginRequest } from "./contracts";

export async function main(event: HttpEvent = {}): Promise<HttpResponse> {
  try {
    const method = getMethod(event);
    const path = event.path ?? "/login";

    if (method === "POST" && path.endsWith("/login")) {
      const body = parseJsonBody<LoginRequest>(event);
      const phoneNumber = requireString(body.phoneNumber, "phoneNumber");
      const password = requireString(body.password, "password");
      const user = await authenticate(phoneNumber, password);
      if (!user) {
        throw new AppError("INVALID_CREDENTIALS", "Phone number or password is incorrect", 401);
      }
      return successResponse(buildBearerToken(user));
    }

    throw new AppError("ROUTE_NOT_FOUND", "Route not found", 404);
  } catch (error) {

    return errorResponse(error);
  }

}

