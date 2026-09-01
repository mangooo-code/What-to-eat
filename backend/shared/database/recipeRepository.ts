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
