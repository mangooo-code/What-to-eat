import { AppError } from "../../../shared/errors/AppError";
import { successResponse } from "../../../shared/errors/httpResponse";
import { requireAuth } from "../../../shared/auth";
import {
  getRecipeById,
  getRecipes,
  getRecipeSeasonings,
  getRecipeSteps,
  saveRecipeWithSteps,
  updateRecipeFavorite,
} from "../../../shared/database";
import type { HttpEvent, HttpResponse } from "../../../shared/types/api";
import { getMethod, getQueryParams, parseJsonBody, requireString } from "../../../shared/validation/http";
import type { RecipeDetailResponse, SaveRecipeRequest, UpdateRecipeFavoriteRequest } from "../contracts";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function recipeIdFromPath(path: string | undefined): string | null {
  const match = (path ?? "").match(/\/recipes\/([^/?]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : null;
}

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

// Mirrors parseCookTimeToMinutes's format, for the reverse direction (DB minutes -> display string).
function formatCookTime(minutes: number | null): string {
  if (minutes === null) return "时间待定";
  return minutes >= 60 ? `${Math.round(minutes / 60)} 小时` : `${minutes} 分钟`;
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
  const recipeId = recipeIdFromPath(event.path);

  if (method === "PATCH" && recipeId) {
    if (!uuidPattern.test(recipeId)) throw new AppError("VALIDATION_ERROR", "id must be a valid uuid");
    const body = parseJsonBody<UpdateRecipeFavoriteRequest>(event);
    if (typeof body.isFavorite !== "boolean") {
      throw new AppError("VALIDATION_ERROR", "isFavorite must be a boolean");
    }
    const recipe = await updateRecipeFavorite(recipeId, userId, body.isFavorite);
    return successResponse({ updated: recipe !== null, recipe }, 200);
  }

  if (method === "GET" && recipeId) {
    if (!uuidPattern.test(recipeId)) throw new AppError("RECIPE_NOT_FOUND", "Recipe was not found", 404);
    const recipe = await getRecipeById(recipeId);
    if (!recipe || recipe.userId !== userId) {
      throw new AppError("RECIPE_NOT_FOUND", "Recipe was not found", 404);
    }
    const [seasonings, steps] = await Promise.all([
      getRecipeSeasonings(recipe.id),
      getRecipeSteps(recipe.id),
    ]);
    const detail: RecipeDetailResponse = {
      id: recipe.id,
      name: recipe.name,
      description: recipe.description,
      difficulty: recipe.difficulty,
      tags: recipe.tags,
      cookTime: formatCookTime(recipe.time),
      seasonings: seasonings.map((seasoning) => ({ name: seasoning.name, quantity: seasoning.quantity ?? "" })),
      steps: steps.map((step) => ({ title: step.title, detailedInstructions: step.detailedInstructions, time: step.time })),
    };
    return successResponse(detail, 200);
  }

  if (method === "GET") {
    const isFavoriteParam = getQueryParams(event).get("isFavorite");
    if (isFavoriteParam !== null && isFavoriteParam !== "true" && isFavoriteParam !== "false") {
      throw new AppError("VALIDATION_ERROR", "isFavorite query param must be 'true' or 'false'");
    }
    const recipes = await getRecipes(userId, isFavoriteParam === null ? undefined : isFavoriteParam === "true");
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
