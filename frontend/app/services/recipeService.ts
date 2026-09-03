import { apiClient } from "./apiClient";
import type { RecipeIngredientDto } from "./findRecipesService";

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

export const recipeService = {
  save: (input: SaveRecipeInput) => apiClient.post<SavedRecipe, SaveRecipeInput>("/recipes", input),
  listFavorites: () => apiClient.get<Recipe[]>("/recipes", { query: { isFavorite: true } }),
  updateFavorite: (id: string, isFavorite: boolean) =>
    apiClient.patch<UpdateRecipeFavoriteResult, { isFavorite: boolean }>(`/recipes/${encodeURIComponent(id)}`, { isFavorite }),
};
