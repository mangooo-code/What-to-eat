import { AppError } from "../../../shared/errors/AppError";
import { successResponse } from "../../../shared/errors/httpResponse";
import { requireAuth } from "../../../shared/auth";
import { listUnitTypes } from "../../../shared/database/inventoryRepository";
import type { HttpEvent, HttpResponse } from "../../../shared/types/api";
import { getMethod } from "../../../shared/validation/http";

export async function handleIngredients(event: HttpEvent): Promise<HttpResponse> {
  const method = getMethod(event);
  requireAuth(event);

  if (method === "GET" && (event.path ?? "").includes("/ingredients/units")) {
    return successResponse(await listUnitTypes());
  }

  throw new AppError("METHOD_NOT_ALLOWED", "Method not allowed", 405);
}
