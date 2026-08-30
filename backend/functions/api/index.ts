import { AppError } from "../../shared/errors/AppError";
import { errorResponse } from "../../shared/errors/httpResponse";
import type { HttpEvent, HttpResponse } from "../../shared/types/api";
import { getMethod } from "../../shared/validation/http";
import { handleLogin } from "./handlers/login";
import { handleInventory } from "./handlers/inventory";
import { handleMembers } from "./handlers/members";

export async function main(event: HttpEvent = {}): Promise<HttpResponse> {
  try {
    const path = event.path ?? "";

    if (getMethod(event) === "POST" && path.endsWith("/login")) {
      return await handleLogin(event);
    }

    if (path.includes("/inventory")) {
      return await handleInventory(event);
    }

    if (path.includes("/members")) {
      return await handleMembers(event);
    }

    throw new AppError("ROUTE_NOT_FOUND", "Route not found", 404);
  } catch (error) {
    return errorResponse(error);
  }
}

