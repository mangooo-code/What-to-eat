import { AppError } from "../../shared/errors/AppError";
import { errorResponse } from "../../shared/errors/httpResponse";
import type { HttpEvent, HttpResponse } from "../../shared/types/api";
import { getMethod, parseJsonBody, requireString } from "../../shared/validation/http";
import type { LoginRequest } from "./contracts";

export async function main(event: HttpEvent = {}): Promise<HttpResponse> {
  try {
    const method = getMethod(event);
    const path = event.path ?? "/auth/login";

    if (method === "POST" && path.endsWith("/login")) {
      const body = parseJsonBody<LoginRequest>(event);
      requireString(body.phoneNumber, "phoneNumber");
      requireString(body.password, "password");
      throw new AppError("NOT_IMPLEMENTED", "Authentication provider is not connected in Phase 1A", 501);
    }

    if ((method === "GET" && path.endsWith("/me")) || (method === "POST" && path.endsWith("/logout"))) {
      throw new AppError("NOT_IMPLEMENTED", "Authentication is not connected in Phase 1A", 501);
    }

    throw new AppError("ROUTE_NOT_FOUND", "Route not found", 404);
  } catch (error) {
    return errorResponse(error);
  }
}
