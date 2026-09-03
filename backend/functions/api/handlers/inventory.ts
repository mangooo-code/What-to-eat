import { AppError } from "../../../shared/errors/AppError";
import { successResponse } from "../../../shared/errors/httpResponse";
import { requireAuth } from "../../../shared/auth";
import {
  consumeIngredientByName,
  createIngredient,
  deleteIngredient,
  hasAnyIngredients,
  listIngredients,
  listLocations,
  listUnitTypes,
  locationBelongsToUser,
  updateIngredient,
} from "../../../shared/database/inventoryRepository";
import type { HttpEvent, HttpResponse } from "../../../shared/types/api";
import { getMethod, parseJsonBody, requireString } from "../../../shared/validation/http";
import type { ConsumeIngredientsRequest, CreateIngredientRequest, UpdateIngredientRequest } from "../contracts";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function ingredientIdFromPath(path: string | undefined): string | null {
  const match = (path ?? "").match(/\/inventory\/([^/?]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : null;
}

function requireNumber(value: unknown, field: string, minimum = 0): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum) {
    throw new AppError("VALIDATION_ERROR", `${field} must be a number greater than or equal to ${minimum}`);
  }
  return value;
}

function requireInteger(value: unknown, field: string): number {
  const number = requireNumber(value, field, 1);
  if (!Number.isInteger(number)) throw new AppError("VALIDATION_ERROR", `${field} must be an integer`);
  return number;
}

function validateOptionalDate(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    throw new AppError("VALIDATION_ERROR", "expiryDate must be a valid ISO date");
  }
  return value;
}

function validateSource(value: unknown): "manual" | "recognition" | "import" {
  if (value === undefined) return "manual";
  if (value === "manual" || value === "recognition" || value === "import") return value;
  throw new AppError("VALIDATION_ERROR", "source is invalid");
}

function parseConsumeItems(value: unknown): Array<{ name: string; quantity: number }> {
  if (!Array.isArray(value)) throw new AppError("VALIDATION_ERROR", "items must be an array");
  return value.map((item, index) => {
    if (typeof item !== "object" || item === null) {
      throw new AppError("VALIDATION_ERROR", `items[${index}] must be an object`);
    }
    const { name, quantity } = item as Record<string, unknown>;
    return {
      name: requireString(name, `items[${index}].name`),
      quantity: requireNumber(quantity, `items[${index}].quantity`),
    };
  });
}

async function assertLocationBelongsToUser(locationId: string, userId: string): Promise<void> {
  if (!uuidPattern.test(locationId) || !(await locationBelongsToUser(locationId, userId))) {
    throw new AppError("LOCATION_NOT_FOUND", "Location was not found", 404);
  }
}

export async function handleInventory(event: HttpEvent): Promise<HttpResponse> {
  const method = getMethod(event);
  const userId = requireAuth(event);

  if (method === "GET" && (event.path ?? "").includes("/inventory/exists")) {
    return successResponse({ hasItems: await hasAnyIngredients(userId) });
  }

  if (method === "POST" && (event.path ?? "").includes("/inventory/consume")) {
    const body = parseJsonBody<ConsumeIngredientsRequest>(event);
    const items = parseConsumeItems(body.items);
    for (const item of items) {
      await consumeIngredientByName(userId, item.name, item.quantity);
    }
    return successResponse({ consumed: true });
  }

  const ingredientId = ingredientIdFromPath(event.path);

  if (method === "GET" && !ingredientId) {
    const [items, locations, unitTypes] = await Promise.all([
      listIngredients(userId),
      listLocations(userId),
      listUnitTypes(),
    ]);
    return successResponse({ items, locations, unitTypes });
  }

  if (method === "POST" && !ingredientId) {
    const body = parseJsonBody<CreateIngredientRequest>(event);
    const locationId = requireString(body.locationId, "locationId");
    await assertLocationBelongsToUser(locationId, userId);
    const ingredient = await createIngredient(userId, {
      name: requireString(body.name, "name"),
      normalizedName: typeof body.normalizedName === "string" ? body.normalizedName.trim() || null : null,
      quantity: requireNumber(body.quantity, "quantity"),
      unitTypeId: requireInteger(body.unitTypeId, "unitTypeId"),
      locationId,
      expiryDate: validateOptionalDate(body.expiryDate),
      imageFileId: typeof body.imageFileId === "string" ? body.imageFileId : null,
      source: validateSource(body.source),
    });
    return successResponse(ingredient, 201);
  }

  if (method === "PATCH" && ingredientId) {
    if (!uuidPattern.test(ingredientId)) throw new AppError("INGREDIENT_NOT_FOUND", "Ingredient was not found", 404);
    const body = parseJsonBody<UpdateIngredientRequest>(event);
    if (body.locationId !== undefined) {
      await assertLocationBelongsToUser(requireString(body.locationId, "locationId"), userId);
    }
    const ingredient = await updateIngredient(ingredientId, userId, {
      ...(body.name !== undefined && { name: requireString(body.name, "name") }),
      ...(body.normalizedName !== undefined && { normalizedName: body.normalizedName?.trim() || null }),
      ...(body.quantity !== undefined && { quantity: requireNumber(body.quantity, "quantity") }),
      ...(body.unitTypeId !== undefined && { unitTypeId: requireInteger(body.unitTypeId, "unitTypeId") }),
      ...(body.locationId !== undefined && { locationId: body.locationId }),
      ...(body.expiryDate !== undefined && { expiryDate: validateOptionalDate(body.expiryDate) }),
      ...(body.imageFileId !== undefined && { imageFileId: body.imageFileId }),
      ...(body.source !== undefined && { source: validateSource(body.source) }),
    });
    if (!ingredient) throw new AppError("INGREDIENT_NOT_FOUND", "Ingredient was not found", 404);
    return successResponse(ingredient);
  }

  if (method === "DELETE" && ingredientId) {
    if (!uuidPattern.test(ingredientId) || !(await deleteIngredient(ingredientId, userId))) {
      throw new AppError("INGREDIENT_NOT_FOUND", "Ingredient was not found", 404);
    }
    return successResponse(null);
  }

  throw new AppError("METHOD_NOT_ALLOWED", "Method not allowed", 405);
}
