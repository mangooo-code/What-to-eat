import { AppError } from "../../../shared/errors/AppError";
import { successResponse } from "../../../shared/errors/httpResponse";
import { requireAuth } from "../../../shared/auth";
import { countMembersByIds } from "../../../shared/database/memberRepository";
import type { HttpEvent, HttpResponse } from "../../../shared/types/api";
import { getMethod, parseJsonBody, requireString } from "../../../shared/validation/http";
import type { FindRecipesRequest } from "../contracts";
import { search } from "../helpers/aiRecipeLookup";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function optionalStringArray(value: unknown, field: string): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new AppError("VALIDATION_ERROR", `${field} must be an array of strings`);
  }
  return [...new Set(value.map((item) => item.trim()).filter(Boolean))];
}

function optionalMemberIds(value: unknown): string[] {
  const memberIds = optionalStringArray(value, "memberIds");
  if (memberIds.some((id) => !uuidPattern.test(id))) {
    throw new AppError("VALIDATION_ERROR", "memberIds must contain valid member ids");
  }
  return memberIds;
}

function optionalBoolean(value: unknown, field: string, fallback = false): boolean {
  if (value === undefined) return fallback;
  if (typeof value !== "boolean") throw new AppError("VALIDATION_ERROR", `${field} must be a boolean`);
  return value;
}

// This endpoint is processing-only for now: it validates the submission and
// echoes back a normalized payload. No data is persisted.
export async function handleFindRecipes(event: HttpEvent): Promise<HttpResponse> {
  const method = getMethod(event);
  const ownerUserId = requireAuth(event);

  if (method === "POST") {
    const body = parseJsonBody<FindRecipesRequest>(event);
    const memberIds = optionalMemberIds(body.memberIds);
    if (memberIds.length && (await countMembersByIds(memberIds, ownerUserId)) !== memberIds.length) {
      throw new AppError("VALIDATION_ERROR", "One or more memberIds do not belong to the requesting user");
    }
    const submission = {
      timePreference: requireString(body.timePreference, "timePreference"),
      memberIds,
      tastePreference: requireString(body.tastePreference, "tastePreference"),
      preferLikedRecipes: optionalBoolean(body.preferLikedRecipes, "preferLikedRecipes"),
      dietaryExclusions: optionalStringArray(body.dietaryExclusions, "dietaryExclusions"),
    };
    const recipes = await search(submission);
    return successResponse(recipes, 200);
  }

  throw new AppError("METHOD_NOT_ALLOWED", "Method not allowed", 405);
}
