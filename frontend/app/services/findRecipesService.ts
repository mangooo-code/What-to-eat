import { apiClient } from "./apiClient";

export interface FindRecipesInput {
  timePreference: string;
  memberIds?: string[];
  tastePreference: string;
  preferLikedRecipes?: boolean;
  dietaryExclusions?: string[];
}

export const findRecipesService = {
  submit: (input: FindRecipesInput) =>
    apiClient.post<FindRecipesInput, FindRecipesInput>("/findrecipes", input),
};
