import { apiClient } from "./apiClient";

export interface FindRecipesInput {
  timePreference: string;
  memberIds?: string[];
  tastePreference: string;
  preferLikedRecipes?: boolean;
  dietaryExclusions?: string[];
}

export interface RecipeIngredientDto {
  name: string;
  quantity: string;
}

export interface RecipeStepDto {
  title: string;
  detailedInstructions: string;
  time: number | null;
}

export interface RecipeDto {
  id: string;
  name: string;
  cookTime: string;
  difficulty: string;
  matchSummary: string;
  description: string;
  tags: string[];
  // Set client-side when the user toggles the 喜欢 button; not returned by /findrecipes.
  isFavorite?: boolean;
  // Only populated for AI-generated recipes for now.
  ingredients?: RecipeIngredientDto[];
  seasonings?: RecipeIngredientDto[];
  steps?: RecipeStepDto[];
}

export const findRecipesService = {
  // AI recipe generation can take noticeably longer than the client's default timeout.
  submit: (input: FindRecipesInput) =>
    apiClient.post<RecipeDto[], FindRecipesInput>("/findrecipes", input, { timeoutMs: 125_000 }),
};
