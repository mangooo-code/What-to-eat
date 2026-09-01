import type { Recipe, RecipeIngredient } from "../types/domain";
import { postgrestRequest } from "./postgrestClient";

interface RecipeRow {
  id: string;
  name: string;
  description: string | null;
  time: string | null;
  difficulty: string | null;
  imageFileId: string | null;
  tags: string[];
  seasonings: string[];
  substitutions: string[];
  steps: Recipe["steps"];
  preferences: Recipe["preferences"];
  source: Recipe["source"];
  rating: string | null;
  ratingCount: number;
  createdDate: string;
  updatedDate: string;
}

interface RecipeIngredientRow {
  id: number;
  recipeId: string;
  ingredientId: string | null;
  nameSnapshot: string | null;
  unitTypeId: number | null;
  quantity: string;
  isOptional: boolean;
}

const recipeColumns = [
  "id", "name", "description", "time", "difficulty", "imageFileId", "tags",
  "seasonings", "substitutions", "steps", "preferences", "source", "rating",
  "ratingCount", "createdDate", "updatedDate",
].join(",");

const recipeIngredientColumns = [
  "id", "recipeId", "ingredientId", "nameSnapshot", "unitTypeId", "quantity", "isOptional",
].join(",");

function mapRecipe(row: RecipeRow): Recipe {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    time: row.time === null ? null : Number(row.time),
    difficulty: row.difficulty,
    imageFileId: row.imageFileId,
    tags: row.tags,
    seasonings: row.seasonings,
    substitutions: row.substitutions,
    steps: row.steps,
    preferences: row.preferences,
    source: row.source,
    rating: row.rating === null ? null : Number(row.rating),
    ratingCount: row.ratingCount,
    createdDate: row.createdDate,
    updatedDate: row.updatedDate,
  };
}

function mapRecipeIngredient(row: RecipeIngredientRow): RecipeIngredient {
  return {
    id: row.id,
    recipeId: row.recipeId,
    ingredientId: row.ingredientId,
    nameSnapshot: row.nameSnapshot,
    unitTypeId: row.unitTypeId,
    quantity: Number(row.quantity),
    isOptional: row.isOptional,
  };
}

export async function listRecipes(options: { limit?: number } = {}): Promise<Recipe[]> {
  const rows = await postgrestRequest<RecipeRow[]>("Recipes", {
    query: { select: recipeColumns, order: "updatedDate.desc,id.asc", limit: options.limit },
  });
  return rows.map(mapRecipe);
}

export async function getRecipeById(id: string): Promise<Recipe | null> {
  const rows = await postgrestRequest<RecipeRow[]>("Recipes", {
    query: { select: recipeColumns, id: `eq.${id}`, limit: 1 },
  });
  return rows[0] ? mapRecipe(rows[0]) : null;
}

export async function listRecipeIngredients(recipeId: string): Promise<RecipeIngredient[]> {
  const rows = await postgrestRequest<RecipeIngredientRow[]>("RecipeIngredients", {
    query: { select: recipeIngredientColumns, recipeId: `eq.${recipeId}`, order: "id.asc" },
  });
  return rows.map(mapRecipeIngredient);
}

export interface RecipeTimeRange {
  /** Match recipes with time <= this value, in minutes. */
  maxMinutes?: number;
  /** Match recipes with time > this value, in minutes. */
  minMinutesExclusive?: number;
}

export const MAX_RESULTS = 3;

// Finds the user's favorited recipes whose time fits the given range and whose non-optional
// ingredients (matched by name, since RecipeIngredients.nameSnapshot is decoupled from any
// specific user's inventory row) are all present in the user's current fridge/pantry inventory.
export async function findMatchingFavoriteRecipeIds(
  userId: string,
  timeRange: RecipeTimeRange = {},
): Promise<string[]> {
  const favorites = await postgrestRequest<Array<{ recipeId: string }>>("RecipeFavorites", {
    query: { select: "recipeId", userId: `eq.${userId}` },
  });
  const favoriteIds = favorites.map((row) => row.recipeId);
  if (!favoriteIds.length) return [];

  const timeFilter: Record<string, string> = {};
  if (timeRange.maxMinutes !== undefined) timeFilter.time = `lte.${timeRange.maxMinutes}`;
  if (timeRange.minMinutesExclusive !== undefined) timeFilter.time = `gt.${timeRange.minMinutesExclusive}`;

  const candidates = await postgrestRequest<Array<{ id: string; rating: string | null }>>("Recipes", {
    query: { select: "id,rating", id: `in.(${favoriteIds.join(",")})`, ...timeFilter },
  });
  const candidateIds = candidates.map((row) => row.id);
  if (!candidateIds.length) return [];
  const ratingById = new Map(candidates.map((row) => [row.id, row.rating === null ? null : Number(row.rating)]));

  const [requiredIngredients, inventory] = await Promise.all([
    postgrestRequest<Array<{ recipeId: string; nameSnapshot: string | null }>>("RecipeIngredients", {
      query: {
        select: "recipeId,nameSnapshot",
        recipeId: `in.(${candidateIds.join(",")})`,
        isOptional: "is.false",
      },
    }),
    postgrestRequest<Array<{ name: string; normalizedName: string | null }>>("Ingredients", {
      query: { select: "name,normalizedName", userId: `eq.${userId}` },
    }),
  ]);

  const availableNames = new Set(
    inventory.map((item) => (item.normalizedName ?? item.name).trim().toLowerCase()),
  );

  const requiredNamesByRecipe = new Map<string, string[]>();
  for (const row of requiredIngredients) {
    if (!row.nameSnapshot) continue;
    const names = requiredNamesByRecipe.get(row.recipeId) ?? [];
    names.push(row.nameSnapshot.trim().toLowerCase());
    requiredNamesByRecipe.set(row.recipeId, names);
  }

  const matchingIds = candidateIds.filter((id) => {
    const requiredNames = requiredNamesByRecipe.get(id) ?? [];
    return requiredNames.every((name) => availableNames.has(name));
  });

  // Highest-rated first (unrated recipes sort last); cap at MAX_RESULTS since the
  // frontend only ever displays a handful of recommendations at a time.
  return matchingIds
    .sort((a, b) => (ratingById.get(b) ?? -1) - (ratingById.get(a) ?? -1))
    .slice(0, MAX_RESULTS);
}
