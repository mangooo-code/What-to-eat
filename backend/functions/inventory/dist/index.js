"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// index.ts
var index_exports = {};
__export(index_exports, {
  main: () => main
});
module.exports = __toCommonJS(index_exports);

// ../../shared/errors/AppError.ts
var AppError = class extends Error {
  constructor(code, message, statusCode = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = "AppError";
  }
  code;
  statusCode;
};

// ../../shared/errors/httpResponse.ts
var headers = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store"
};
function successResponse(data, statusCode = 200) {
  const payload = { success: true, data };
  return { statusCode, headers, body: JSON.stringify(payload) };
}
function errorResponse(error) {
  const appError = error instanceof AppError ? error : new AppError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  const payload = {
    success: false,
    error: { code: appError.code, message: appError.message }
  };
  return { statusCode: appError.statusCode, headers, body: JSON.stringify(payload) };
}

// ../../shared/auth/development.ts
function getDevelopmentUserId(env = process.env) {
  const userId = env.DEV_USER_ID?.trim();
  if (!userId) {
    throw new AppError("DEVELOPMENT_USER_NOT_CONFIGURED", "DEV_USER_ID is not configured", 500);
  }
  return userId;
}

// ../../shared/database/postgrestClient.ts
function requireEnvironment(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new AppError("DATABASE_HTTP_NOT_CONFIGURED", `${name} is not configured`, 500);
  }
  return value;
}
function timeoutFromEnvironment() {
  const value = Number(process.env.DATABASE_HTTP_TIMEOUT_MS);
  return Number.isFinite(value) && value > 0 ? value : 8e3;
}
function postgrestUrl(resource, query) {
  const envId = requireEnvironment("ENV_ID");
  const url = new URL(
    `/v1/rdb/rest/${resource.split("/").map(encodeURIComponent).join("/")}`,
    `https://${envId}.api.tcloudbasegateway.com`
  );
  for (const [name, value] of Object.entries(query ?? {})) {
    if (value !== void 0) url.searchParams.append(name, String(value));
  }
  return url;
}
async function postgrestRequest(resource, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutFromEnvironment());
  try {
    const response = await fetch(postgrestUrl(resource, options.query), {
      method: options.method ?? "GET",
      headers: {
        Authorization: `Bearer ${requireEnvironment("CLOUDBASE_API_KEY")}`,
        Accept: "application/json",
        ...options.body === void 0 ? {} : { "Content-Type": "application/json" },
        ...options.prefer ? { Prefer: options.prefer } : {}
      },
      body: options.body === void 0 ? void 0 : JSON.stringify(options.body),
      signal: controller.signal
    });
    const responseText = await response.text();
    const responseBody = responseText ? JSON.parse(responseText) : null;
    if (!response.ok) {
      const detail = responseBody && typeof responseBody === "object" && "message" in responseBody ? String(responseBody.message) : `PostgreSQL HTTP API returned ${response.status}`;
      throw new AppError("DATABASE_HTTP_ERROR", detail, 502);
    }
    return responseBody;
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new AppError("DATABASE_HTTP_TIMEOUT", "PostgreSQL HTTP API request timed out", 504);
    }
    throw new AppError("DATABASE_HTTP_ERROR", "PostgreSQL HTTP API request failed", 502);
  } finally {
    clearTimeout(timeout);
  }
}

// ../../shared/database/inventoryRepository.ts
function mapIngredient(row) {
  return {
    id: row.id,
    ownerUserId: row.userId,
    name: row.name,
    normalizedName: row.normalizedName,
    quantity: Number(row.quantity),
    unitTypeId: row.unitTypeId,
    locationId: row.locationId,
    expiryDate: row.expiryDate,
    imageFileId: row.imageFileId,
    source: row.source,
    createdDate: row.createdDate,
    updatedDate: row.updatedDate
  };
}
var ingredientColumns = [
  "id",
  "userId",
  "name",
  "normalizedName",
  "quantity",
  "unitTypeId",
  "locationId",
  "expiryDate",
  "imageFileId",
  "source",
  "createdDate",
  "updatedDate"
].join(",");
async function listIngredients(userId) {
  const rows = await postgrestRequest("Ingredients", {
    query: { select: ingredientColumns, userId: `eq.${userId}`, order: "updatedDate.desc,id.asc" }
  });
  return rows.map(mapIngredient);
}
async function listLocations(userId) {
  return postgrestRequest("Locations", {
    query: { select: "id,key,name", userId: `eq.${userId}`, key: "in.(fridge,freezer,pantry)", order: "key.asc" }
  });
}
async function listUnitTypes() {
  return postgrestRequest("IngredientUnitTypes", {
    query: { select: "id,name", order: "id.asc" }
  });
}
async function locationBelongsToUser(locationId, userId) {
  const rows = await postgrestRequest("Locations", {
    query: { select: "id", id: `eq.${locationId}`, userId: `eq.${userId}`, limit: 1 }
  });
  return rows.length > 0;
}
async function createIngredient(userId, input) {
  const rows = await postgrestRequest("Ingredients", {
    method: "POST",
    query: { select: ingredientColumns },
    prefer: "return=representation",
    body: { userId, ...input }
  });
  return mapIngredient(rows[0]);
}
async function updateIngredient(id, userId, input) {
  const entries = Object.entries(input).filter(([, value]) => value !== void 0);
  if (!entries.length) {
    const rows2 = await postgrestRequest("Ingredients", {
      query: { select: ingredientColumns, id: `eq.${id}`, userId: `eq.${userId}`, limit: 1 }
    });
    return rows2[0] ? mapIngredient(rows2[0]) : null;
  }
  const rows = await postgrestRequest("Ingredients", {
    method: "PATCH",
    query: { select: ingredientColumns, id: `eq.${id}`, userId: `eq.${userId}` },
    prefer: "return=representation",
    body: { ...Object.fromEntries(entries), updatedDate: (/* @__PURE__ */ new Date()).toISOString() }
  });
  return rows[0] ? mapIngredient(rows[0]) : null;
}
async function deleteIngredient(id, userId) {
  const rows = await postgrestRequest("Ingredients", {
    method: "DELETE",
    query: { select: "id", id: `eq.${id}`, userId: `eq.${userId}` },
    prefer: "return=representation"
  });
  return rows.length > 0;
}

// ../../shared/validation/http.ts
function getMethod(event) {
  return (event.httpMethod ?? event.requestContext?.httpMethod ?? "").toUpperCase();
}
function parseJsonBody(event) {
  if (event.body === null || event.body === void 0) {
    throw new AppError("INVALID_REQUEST", "Request body is required");
  }
  if (typeof event.body === "object") return event.body;
  try {
    const source = event.isBase64Encoded ? Buffer.from(event.body, "base64").toString("utf8") : event.body;
    return JSON.parse(source);
  } catch {
    throw new AppError("INVALID_JSON", "Request body must be valid JSON");
  }
}
function requireString(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw new AppError("VALIDATION_ERROR", `${field} is required`);
  }
  return value.trim();
}

// index.ts
var uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function ingredientIdFromPath(path) {
  const match = (path ?? "").match(/\/inventory\/([^/?]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : null;
}
function requireNumber(value, field, minimum = 0) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum) {
    throw new AppError("VALIDATION_ERROR", `${field} must be a number greater than or equal to ${minimum}`);
  }
  return value;
}
function requireInteger(value, field) {
  const number = requireNumber(value, field, 1);
  if (!Number.isInteger(number)) throw new AppError("VALIDATION_ERROR", `${field} must be an integer`);
  return number;
}
function validateOptionalDate(value) {
  if (value === void 0 || value === null || value === "") return null;
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    throw new AppError("VALIDATION_ERROR", "expiryDate must be a valid ISO date");
  }
  return value;
}
function validateSource(value) {
  if (value === void 0) return "manual";
  if (value === "manual" || value === "recognition" || value === "import") return value;
  throw new AppError("VALIDATION_ERROR", "source is invalid");
}
async function main(event = {}) {
  try {
    const method = getMethod(event);
    const userId = getDevelopmentUserId();
    const ingredientId = ingredientIdFromPath(event.path);
    if (method === "GET" && !ingredientId) {
      const [items, locations, unitTypes] = await Promise.all([
        listIngredients(userId),
        listLocations(userId),
        listUnitTypes()
      ]);
      return successResponse({ items, locations, unitTypes });
    }
    if (method === "POST" && !ingredientId) {
      const body = parseJsonBody(event);
      const locationId = requireString(body.locationId, "locationId");
      if (!uuidPattern.test(locationId) || !await locationBelongsToUser(locationId, userId)) {
        throw new AppError("LOCATION_NOT_FOUND", "Location was not found", 404);
      }
      const ingredient = await createIngredient(userId, {
        name: requireString(body.name, "name"),
        normalizedName: typeof body.normalizedName === "string" ? body.normalizedName.trim() || null : null,
        quantity: requireNumber(body.quantity, "quantity"),
        unitTypeId: requireInteger(body.unitTypeId, "unitTypeId"),
        locationId,
        expiryDate: validateOptionalDate(body.expiryDate),
        imageFileId: typeof body.imageFileId === "string" ? body.imageFileId : null,
        source: validateSource(body.source)
      });
      return successResponse(ingredient, 201);
    }
    if (method === "PATCH" && ingredientId) {
      if (!uuidPattern.test(ingredientId)) throw new AppError("INGREDIENT_NOT_FOUND", "Ingredient was not found", 404);
      const body = parseJsonBody(event);
      if (body.locationId !== void 0) {
        const locationId = requireString(body.locationId, "locationId");
        if (!uuidPattern.test(locationId) || !await locationBelongsToUser(locationId, userId)) {
          throw new AppError("LOCATION_NOT_FOUND", "Location was not found", 404);
        }
      }
      const ingredient = await updateIngredient(ingredientId, userId, {
        ...body.name !== void 0 && { name: requireString(body.name, "name") },
        ...body.normalizedName !== void 0 && { normalizedName: body.normalizedName?.trim() || null },
        ...body.quantity !== void 0 && { quantity: requireNumber(body.quantity, "quantity") },
        ...body.unitTypeId !== void 0 && { unitTypeId: requireInteger(body.unitTypeId, "unitTypeId") },
        ...body.locationId !== void 0 && { locationId: body.locationId },
        ...body.expiryDate !== void 0 && { expiryDate: validateOptionalDate(body.expiryDate) },
        ...body.imageFileId !== void 0 && { imageFileId: body.imageFileId },
        ...body.source !== void 0 && { source: validateSource(body.source) }
      });
      if (!ingredient) throw new AppError("INGREDIENT_NOT_FOUND", "Ingredient was not found", 404);
      return successResponse(ingredient);
    }
    if (method === "DELETE" && ingredientId) {
      if (!uuidPattern.test(ingredientId) || !await deleteIngredient(ingredientId, userId)) {
        throw new AppError("INGREDIENT_NOT_FOUND", "Ingredient was not found", 404);
      }
      return successResponse(null);
    }
    throw new AppError("METHOD_NOT_ALLOWED", "Method not allowed", 405);
  } catch (error) {
    return errorResponse(error);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  main
});
