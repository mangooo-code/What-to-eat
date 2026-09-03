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

export const recipeService = {
  save: (input: SaveRecipeInput) => apiClient.post<SavedRecipe, SaveRecipeInput>("/recipes", input),
};
