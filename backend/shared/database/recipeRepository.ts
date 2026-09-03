import type { Recipe, RecipeIngredient, RecipeSeasoning, RecipeStep } from "../types/domain";
import { postgrestRequest } from "./postgrestClient";

interface RecipeRow {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  time: string | null;
  difficulty: string | null;
  imageFileId: string | null;
  tags: string[];
  substitutions: string[];
  preferences: Recipe["preferences"];
  isFavorite: boolean;
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

interface RecipeStepRow {
  id: string;
  recipeId: string;
  stepNumber: number;
  title: string;
  detailedInstructions: string;
  time: string | null;
  createdAt: string;
  updatedAt: string;
}

interface RecipeSeasoningRow {
  id: string;
  recipeId: string;
  name: string;
  quantity: string | null;
  createdAt: string;
  updatedAt: string;
}

const recipeColumns = [
  "id", "userId", "name", "description", "time", "difficulty", "imageFileId", "tags",
  "substitutions", "preferences", "isFavorite", "source", "rating",
  "ratingCount", "createdDate", "updatedDate",
].join(",");

const recipeIngredientColumns = [
  "id", "recipeId", "ingredientId", "nameSnapshot", "unitTypeId", "quantity", "isOptional",
].join(",");

const recipeStepColumns = [
  "id", "recipeId", "stepNumber", "title", "detailedInstructions", "time", "createdAt", "updatedAt",
].join(",");

const recipeSeasoningColumns = [
  "id", "recipeId", "name", "quantity", "createdAt", "updatedAt",
].join(",");

function mapRecipe(row: RecipeRow): Recipe {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    description: row.description,
    time: row.time === null ? null : Number(row.time),
    difficulty: row.difficulty,
    imageFileId: row.imageFileId,
    tags: row.tags,
    substitutions: row.substitutions,
    preferences: row.preferences,
    isFavorite: row.isFavorite,
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

function mapRecipeStep(row: RecipeStepRow): RecipeStep {
  return {
    id: row.id,
    recipeId: row.recipeId,
    stepNumber: row.stepNumber,
    title: row.title,
    detailedInstructions: row.detailedInstructions,
    time: row.time === null ? null : Number(row.time),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapRecipeSeasoning(row: RecipeSeasoningRow): RecipeSeasoning {
  return {
    id: row.id,
    recipeId: row.recipeId,
    name: row.name,
    quantity: row.quantity,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function getRecipeById(id: string): Promise<Recipe | null> {
  const rows = await postgrestRequest<RecipeRow[]>("Recipes", {
    query: { select: recipeColumns, id: `eq.${id}`, limit: 1 },
  });
  return rows[0] ? mapRecipe(rows[0]) : null;
}

export async function getRecipes(userId: string, isFavorite?: boolean | null): Promise<Recipe[]> {
  const rows = await postgrestRequest<RecipeRow[]>("Recipes", {
    query: {
      select: recipeColumns,
      userId: `eq.${userId}`,
      isFavorite: isFavorite === undefined || isFavorite === null ? undefined : `is.${isFavorite}`,
      order: "updatedDate.desc",
    },
  });
  return rows.map(mapRecipe);
}

// Scoped to the owning user via the userId filter, so this both enforces ownership and
// naturally returns null when the recipe doesn't exist (yet) or belongs to someone else.
export async function updateRecipeFavorite(id: string, userId: string, isFavorite: boolean): Promise<Recipe | null> {
  const rows = await postgrestRequest<RecipeRow[]>("Recipes", {
    method: "PATCH",
    query: { select: recipeColumns, id: `eq.${id}`, userId: `eq.${userId}` },
    prefer: "return=representation",
    body: { isFavorite },
  });
  return rows[0] ? mapRecipe(rows[0]) : null;
}

export interface SaveRecipeInput {
  id: string;
  name: string;
  description: string | null;
  difficulty: string | null;
  tags: string[];
  time: number | null;
  source: Recipe["source"];
}

export interface SaveRecipeStepInput {
  title: string;
  detailedInstructions: string;
  time: number | null;
}

export interface SaveRecipeSeasoningInput {
  name: string;
  quantity: string | null;
}

// Idempotent by id: if the recipe already exists (e.g. an already-favorited recipe
// picked from findrecipes), returns it as-is instead of creating a duplicate.
export async function saveRecipeWithSteps(
  userId: string,
  recipe: SaveRecipeInput,
  steps: SaveRecipeStepInput[],
  seasonings: SaveRecipeSeasoningInput[] = [],
): Promise<Recipe> {
  const existing = await getRecipeById(recipe.id);
  if (existing) return existing;

  const rows = await postgrestRequest<RecipeRow[]>("Recipes", {
    method: "POST",
    query: { select: recipeColumns },
    prefer: "return=representation",
    body: {
      id: recipe.id,
      userId,
      name: recipe.name,
      description: recipe.description,
      difficulty: recipe.difficulty,
      tags: recipe.tags,
      time: recipe.time,
      source: recipe.source,
      isFavorite: false,
    },
  });
  const created = mapRecipe(rows[0]);

  if (steps.length) {
    await postgrestRequest("RecipeSteps", {
      method: "POST",
      body: steps.map((step, index) => ({
        recipeId: created.id,
        stepNumber: index + 1,
        title: step.title,
        detailedInstructions: step.detailedInstructions,
        time: step.time,
      })),
    });
  }

  if (seasonings.length) {
    await postgrestRequest("RecipeSeasonings", {
      method: "POST",
      body: seasonings.map((seasoning) => ({
        recipeId: created.id,
        name: seasoning.name,
        quantity: seasoning.quantity,
      })),
    });
  }

  return created;
}

export async function getRecipeIngredients(recipeId: string): Promise<RecipeIngredient[]> {
  const rows = await postgrestRequest<RecipeIngredientRow[]>("RecipeIngredients", {
    query: { select: recipeIngredientColumns, recipeId: `eq.${recipeId}`, order: "id.asc" },
  });
  return rows.map(mapRecipeIngredient);
}

export async function getRecipeSteps(recipeId: string): Promise<RecipeStep[]> {
  const rows = await postgrestRequest<RecipeStepRow[]>("RecipeSteps", {
    query: { select: recipeStepColumns, recipeId: `eq.${recipeId}`, order: "stepNumber.asc" },
  });
  return rows.map(mapRecipeStep);
}

export async function getRecipeSeasonings(recipeId: string): Promise<RecipeSeasoning[]> {
  const rows = await postgrestRequest<RecipeSeasoningRow[]>("RecipeSeasonings", {
    query: { select: recipeSeasoningColumns, recipeId: `eq.${recipeId}`, order: "createdAt.asc" },
  });
  return rows.map(mapRecipeSeasoning);
}

export interface RecipeTimeRange {
  /** Match recipes with time <= this value, in minutes. */
  maxMinutes?: number;
  /** Match recipes with time > this value, in minutes. */
  minMinutesExclusive?: number;
}

export const MAX_RESULTS = 3;

// Finds the user's favorited recipes (Recipes.isFavorite) whose time fits the given range and
// whose non-optional ingredients (matched by name, since RecipeIngredients.nameSnapshot is
// decoupled from any specific user's inventory row) are all present in the user's inventory.
export async function findMatchingFavoriteRecipeIds(
  userId: string,
  timeRange: RecipeTimeRange = {},
): Promise<string[]> {
  const timeFilter: Record<string, string> = {};
  if (timeRange.maxMinutes !== undefined) timeFilter.time = `lte.${timeRange.maxMinutes}`;
  if (timeRange.minMinutesExclusive !== undefined) timeFilter.time = `gt.${timeRange.minMinutesExclusive}`;

  const candidates = await postgrestRequest<Array<{ id: string; rating: string | null }>>("Recipes", {
    query: { select: "id,rating", userId: `eq.${userId}`, isFavorite: "is.true", ...timeFilter },
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
