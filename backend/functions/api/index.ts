import { AppError } from "../../shared/errors/AppError";
import { corsPreflightResponse, errorResponse } from "../../shared/errors/httpResponse";
import type { HttpEvent, HttpResponse } from "../../shared/types/api";
import { getMethod } from "../../shared/validation/http";
import { handleLogin } from "./handlers/login";
import { handleInventory } from "./handlers/inventory";
import { handleMembers } from "./handlers/members";
import { handleUser } from "./handlers/user";

export async function main(event: HttpEvent = {}): Promise<HttpResponse> {
  const method = getMethod(event);
  if (method === "OPTIONS") {
    return corsPreflightResponse();
  }

  try {
    const path = event.path ?? "";

    if (method === "POST" && path.endsWith("/login")) {
      return await handleLogin(event);
    }

    if (path.includes("/inventory")) {
      return await handleInventory(event);
    }

    if (path.includes("/members")) {
      return await handleMembers(event);
    }

    if (path.includes("/user")) {
      return await handleUser(event);
    }

    throw new AppError("ROUTE_NOT_FOUND", "Route not found", 404);
  } catch (error) {
    return errorResponse(error);
  }
}

