import { AppError } from "../../shared/errors/AppError";
import { errorResponse, successResponse } from "../../shared/errors/httpResponse";
import { requireAuth } from "../../shared/auth";
import {
  createMember,
  deleteMember,
  listMembers,
  updateMember,
} from "../../shared/database/memberRepository";
import type { HttpEvent, HttpResponse } from "../../shared/types/api";
import { getMethod, parseJsonBody, requireString } from "../../shared/validation/http";
import type { CreateMemberRequest, UpdateMemberRequest } from "./contracts";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function memberIdFromPath(path: string | undefined): string | null {
  const match = (path ?? "").match(/\/members\/([^/?]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : null;
}

function optionalString(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw new AppError("VALIDATION_ERROR", `${field} must be a string`);
  return value.trim() || null;
}

function optionalStringArray(value: unknown, field: string): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new AppError("VALIDATION_ERROR", `${field} must be an array of strings`);
  }
  return [...new Set(value.map((item) => item.trim()).filter(Boolean))];
}

function optionalBoolean(value: unknown, field: string, fallback = false): boolean {
  if (value === undefined) return fallback;
  if (typeof value !== "boolean") throw new AppError("VALIDATION_ERROR", `${field} must be a boolean`);
  return value;
}

export async function main(event: HttpEvent = {}): Promise<HttpResponse> {
  try {
    const method = getMethod(event);
    const ownerUserId = requireAuth(event);
    const memberId = memberIdFromPath(event.path);

    if (method === "GET" && !memberId) {
      return successResponse(await listMembers(ownerUserId));
    }

    if (method === "POST" && !memberId) {
      const body = parseJsonBody<CreateMemberRequest>(event);
      const member = await createMember(ownerUserId, {
        name: requireString(body.name, "name"),
        relationship: requireString(body.relationship, "relationship"),
        isOwner: optionalBoolean(body.isOwner, "isOwner"),
        tastePreference: optionalString(body.tastePreference, "tastePreference"),
        dietPreference: optionalString(body.dietPreference, "dietPreference"),
        dietaryRestrictions: optionalStringArray(body.dietaryRestrictions, "dietaryRestrictions"),
        allergens: optionalStringArray(body.allergens, "allergens"),
      });
      return successResponse(member, 201);
    }

    if (method === "PATCH" && memberId) {
      if (!uuidPattern.test(memberId)) throw new AppError("MEMBER_NOT_FOUND", "Member was not found", 404);
      const body = parseJsonBody<UpdateMemberRequest>(event);
      const member = await updateMember(memberId, ownerUserId, {
        ...(body.name !== undefined && { name: requireString(body.name, "name") }),
        ...(body.relationship !== undefined && { relationship: requireString(body.relationship, "relationship") }),
        ...(body.isOwner !== undefined && { isOwner: optionalBoolean(body.isOwner, "isOwner") }),
        ...(body.tastePreference !== undefined && { tastePreference: optionalString(body.tastePreference, "tastePreference") }),
        ...(body.dietPreference !== undefined && { dietPreference: optionalString(body.dietPreference, "dietPreference") }),
        ...(body.dietaryRestrictions !== undefined && { dietaryRestrictions: optionalStringArray(body.dietaryRestrictions, "dietaryRestrictions") }),
        ...(body.allergens !== undefined && { allergens: optionalStringArray(body.allergens, "allergens") }),
      });
      if (!member) throw new AppError("MEMBER_NOT_FOUND", "Member was not found", 404);
      return successResponse(member);
    }

    if (method === "DELETE" && memberId) {
      if (!uuidPattern.test(memberId) || !(await deleteMember(memberId, ownerUserId))) {
        throw new AppError("MEMBER_NOT_FOUND", "Member was not found", 404);
      }
      return successResponse(null);
    }

    throw new AppError("METHOD_NOT_ALLOWED", "Method not allowed", 405);
  } catch (error) {
    return errorResponse(error);
  }
}
