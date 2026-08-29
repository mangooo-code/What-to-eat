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

// ../../shared/database/memberRepository.ts
var memberColumns = [
  "id",
  "ownerUserId",
  "name",
  "relationship",
  "isOwner",
  "tastePreference",
  "dietPreference",
  "dietaryRestrictions",
  "allergens",
  "createdDate",
  "updatedDate"
].join(",");
function mapMember(row) {
  return {
    memberId: row.id,
    ownerUserId: row.ownerUserId,
    name: row.name,
    relationship: row.relationship,
    isOwner: row.isOwner,
    tastePreference: row.tastePreference,
    dietPreference: row.dietPreference,
    dietaryRestrictions: row.dietaryRestrictions,
    allergens: row.allergens,
    createdDate: row.createdDate,
    updatedDate: row.updatedDate
  };
}
async function listMembers(ownerUserId) {
  const rows = await postgrestRequest("HouseholdMembers", {
    query: {
      select: memberColumns,
      ownerUserId: `eq.${ownerUserId}`,
      order: "isOwner.desc,createdDate.asc,id.asc"
    }
  });
  return rows.map(mapMember);
}
async function createMember(ownerUserId, input) {
  const rows = await postgrestRequest("HouseholdMembers", {
    method: "POST",
    query: { select: memberColumns },
    prefer: "return=representation",
    body: { ownerUserId, ...input }
  });
  return mapMember(rows[0]);
}
async function updateMember(memberId, ownerUserId, input) {
  const entries = Object.entries(input).filter(([, value]) => value !== void 0);
  if (!entries.length) {
    const rows2 = await postgrestRequest("HouseholdMembers", {
      query: { select: memberColumns, id: `eq.${memberId}`, ownerUserId: `eq.${ownerUserId}`, limit: 1 }
    });
    return rows2[0] ? mapMember(rows2[0]) : null;
  }
  const rows = await postgrestRequest("HouseholdMembers", {
    method: "PATCH",
    query: { select: memberColumns, id: `eq.${memberId}`, ownerUserId: `eq.${ownerUserId}` },
    prefer: "return=representation",
    body: { ...Object.fromEntries(entries), updatedDate: (/* @__PURE__ */ new Date()).toISOString() }
  });
  return rows[0] ? mapMember(rows[0]) : null;
}
async function deleteMember(memberId, ownerUserId) {
  const rows = await postgrestRequest("HouseholdMembers", {
    method: "DELETE",
    query: { select: "id", id: `eq.${memberId}`, ownerUserId: `eq.${ownerUserId}` },
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
function memberIdFromPath(path) {
  const match = (path ?? "").match(/\/members\/([^/?]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : null;
}
function optionalString(value, field) {
  if (value === void 0 || value === null || value === "") return null;
  if (typeof value !== "string") throw new AppError("VALIDATION_ERROR", `${field} must be a string`);
  return value.trim() || null;
}
function optionalStringArray(value, field) {
  if (value === void 0) return [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new AppError("VALIDATION_ERROR", `${field} must be an array of strings`);
  }
  return [...new Set(value.map((item) => item.trim()).filter(Boolean))];
}
function optionalBoolean(value, field, fallback = false) {
  if (value === void 0) return fallback;
  if (typeof value !== "boolean") throw new AppError("VALIDATION_ERROR", `${field} must be a boolean`);
  return value;
}
async function main(event = {}) {
  try {
    const method = getMethod(event);
    const ownerUserId = getDevelopmentUserId();
    const memberId = memberIdFromPath(event.path);
    if (method === "GET" && !memberId) {
      return successResponse(await listMembers(ownerUserId));
    }
    if (method === "POST" && !memberId) {
      const body = parseJsonBody(event);
      const member = await createMember(ownerUserId, {
        name: requireString(body.name, "name"),
        relationship: requireString(body.relationship, "relationship"),
        isOwner: optionalBoolean(body.isOwner, "isOwner"),
        tastePreference: optionalString(body.tastePreference, "tastePreference"),
        dietPreference: optionalString(body.dietPreference, "dietPreference"),
        dietaryRestrictions: optionalStringArray(body.dietaryRestrictions, "dietaryRestrictions"),
        allergens: optionalStringArray(body.allergens, "allergens")
      });
      return successResponse(member, 201);
    }
    if (method === "PATCH" && memberId) {
      if (!uuidPattern.test(memberId)) throw new AppError("MEMBER_NOT_FOUND", "Member was not found", 404);
      const body = parseJsonBody(event);
      const member = await updateMember(memberId, ownerUserId, {
        ...body.name !== void 0 && { name: requireString(body.name, "name") },
        ...body.relationship !== void 0 && { relationship: requireString(body.relationship, "relationship") },
        ...body.isOwner !== void 0 && { isOwner: optionalBoolean(body.isOwner, "isOwner") },
        ...body.tastePreference !== void 0 && { tastePreference: optionalString(body.tastePreference, "tastePreference") },
        ...body.dietPreference !== void 0 && { dietPreference: optionalString(body.dietPreference, "dietPreference") },
        ...body.dietaryRestrictions !== void 0 && { dietaryRestrictions: optionalStringArray(body.dietaryRestrictions, "dietaryRestrictions") },
        ...body.allergens !== void 0 && { allergens: optionalStringArray(body.allergens, "allergens") }
      });
      if (!member) throw new AppError("MEMBER_NOT_FOUND", "Member was not found", 404);
      return successResponse(member);
    }
    if (method === "DELETE" && memberId) {
      if (!uuidPattern.test(memberId) || !await deleteMember(memberId, ownerUserId)) {
        throw new AppError("MEMBER_NOT_FOUND", "Member was not found", 404);
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
