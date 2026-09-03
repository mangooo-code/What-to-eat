import { AppError } from "../../../shared/errors/AppError";
import { successResponse } from "../../../shared/errors/httpResponse";
import { requireAuth } from "../../../shared/auth";
import { getRecipes, saveRecipeWithSteps } from "../../../shared/database";
import type { HttpEvent, HttpResponse } from "../../../shared/types/api";
import { getMethod, getQueryParams, parseJsonBody, requireString } from "../../../shared/validation/http";
import type { SaveRecipeRequest } from "../contracts";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Reverses formatCookTime()'s output ("N 分钟" / "N 小时") on a best-effort basis;
// falls back to null (the column is nullable) for anything else.
function parseCookTimeToMinutes(cookTime: string | undefined): number | null {
  if (!cookTime) return null;
  const hours = cookTime.match(/^(\d+(?:\.\d+)?)\s*小时/);
  if (hours) return Number(hours[1]) * 60;
  const minutes = cookTime.match(/^(\d+(?:\.\d+)?)\s*分钟/);
  if (minutes) return Number(minutes[1]);
  return null;
}

function optionalStringArray(value: unknown, field: string): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new AppError("VALIDATION_ERROR", `${field} must be an array of strings`);
  }
  return value;
}

export async function handleRecipes(event: HttpEvent): Promise<HttpResponse> {
  const method = getMethod(event);
  const userId = requireAuth(event);

  if (method === "GET") {
    const isFavoriteParam = getQueryParams(event).get("isFavorite");
    if (isFavoriteParam !== "true" && isFavoriteParam !== "false") {
      throw new AppError("VALIDATION_ERROR", "isFavorite query param must be 'true' or 'false'");
    }
    const recipes = await getRecipes(userId, isFavoriteParam === "true");
    return successResponse(recipes, 200);
  }

  if (method === "POST") {
    const body = parseJsonBody<SaveRecipeRequest>(event);
    const id = requireString(body.id, "id");
    if (!uuidPattern.test(id)) throw new AppError("VALIDATION_ERROR", "id must be a valid uuid");
    const name = requireString(body.name, "name");
    const seasonings = (Array.isArray(body.seasonings) ? body.seasonings : []).map((item) => ({
      name: item.name,
      quantity: item.quantity ?? null,
    }));
    const steps = (Array.isArray(body.steps) ? body.steps : []).map((step) => ({
      title: step.title,
      detailedInstructions: step.detailedInstructions,
      time: step.time,
    }));

    const recipe = await saveRecipeWithSteps(
      userId,
      {
        id,
        name,
        description: body.description ?? null,
        difficulty: body.difficulty ?? null,
        tags: optionalStringArray(body.tags, "tags"),
        time: parseCookTimeToMinutes(body.cookTime),
        source: "ai_generated",
      },
      steps,
      seasonings,
    );
    return successResponse(recipe, 201);
  }

  throw new AppError("METHOD_NOT_ALLOWED", "Method not allowed", 405);
}
