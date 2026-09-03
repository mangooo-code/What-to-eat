import { apiClient } from "./apiClient";
import type { RecipeIngredientDto, RecipeStepDto } from "./findRecipesService";

export interface SaveRecipeStepInput {
  title: string;
  detailedInstructions: string;
  time: number | null;
}

export interface SaveRecipeInput {
  id: string;
  name: string;
  description?: string | null;
  difficulty?: string | null;
  tags?: string[];
  cookTime?: string;
  seasonings?: RecipeIngredientDto[];
  ingredients?: RecipeIngredientDto[];
  steps?: SaveRecipeStepInput[];
}

export interface SavedRecipe {
  id: string;
}

// Mirrors the backend's Recipe domain type (shared/types/domain.ts).
export interface Recipe {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  time: number | null;
  difficulty: string | null;
  imageFileId: string | null;
  tags: string[];
  substitutions: string[];
  isFavorite: boolean;
  source: "curated" | "ai_generated";
  rating: number | null;
  ratingCount: number;
  createdDate: string;
  updatedDate: string;
}

export interface UpdateRecipeFavoriteResult {
  updated: boolean;
  recipe: Recipe | null;
}

// Returned by GET /recipes/{id} (a single recipe with its ingredients/seasonings/steps).
export interface RecipeDetail {
  id: string;
  name: string;
  description: string | null;
  difficulty: string | null;
  tags: string[];
  isFavorite: boolean;
  cookTime: string;
  // From RecipeIngredients; quantity is a real number here (unlike seasonings' free-text amounts).
  ingredients: Array<{ name: string; quantity: number; unit: string }>;
  seasonings: RecipeIngredientDto[];
  steps: RecipeStepDto[];
}

// Returned by GET /recipes (list): a lightweight card view for 我的菜谱, enriched with a
// live ingredient-availability check computed on the backend.
export interface RecipeListItem {
  id: string;
  name: string;
  cookTime: string;
  difficulty: string | null;
  isFavorite: boolean;
  updatedDate: string;
  // e.g. "主要食材全部已有" / "缺少 2 种主要食材".
  matchSummary: string;
  hasEnoughIngredients: boolean;
}

export const recipeService = {
  save: (input: SaveRecipeInput) => apiClient.post<SavedRecipe, SaveRecipeInput>("/recipes", input),
  getById: (id: string) => apiClient.get<RecipeDetail>(`/recipes/${encodeURIComponent(id)}`),
  list: () => apiClient.get<RecipeListItem[]>("/recipes"),
  listFavorites: () => apiClient.get<RecipeListItem[]>("/recipes", { query: { isFavorite: true } }),
  updateFavorite: (id: string, isFavorite: boolean) =>
    apiClient.patch<UpdateRecipeFavoriteResult, { isFavorite: boolean }>(`/recipes/${encodeURIComponent(id)}`, { isFavorite }),
};
