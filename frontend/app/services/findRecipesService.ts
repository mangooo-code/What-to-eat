import { apiClient } from "./apiClient";

export interface FindRecipesInput {
  timePreference: string;
  memberIds?: string[];
  tastePreference: string;
  preferLikedRecipes?: boolean;
  dietaryExclusions?: string[];
}

export interface RecipeDto {
  id: string;
  name: string;
  cookTime: string;
  difficulty: string;
  matchSummary: string;
  description: string;
  tags: string[];
}

export const findRecipesService = {
  submit: (input: FindRecipesInput) =>
    apiClient.post<RecipeDto[], FindRecipesInput>("/findrecipes", input),
};
