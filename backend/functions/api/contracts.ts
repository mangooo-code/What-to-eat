import type { Ingredient } from "../../shared/types/domain";

export interface LoginRequest {
  phoneNumber: string;
  password: string;
}

export type IngredientSource = Ingredient["source"];

export interface CreateIngredientRequest {
  name: string;
  normalizedName?: string | null;
  quantity: number;
  unitTypeId: number;
  locationId: string;
  expiryDate?: string | null;
  imageFileId?: string | null;
  source?: IngredientSource;
}

export type UpdateIngredientRequest = Partial<CreateIngredientRequest>;

export interface CreateMemberRequest {
  name: string;
  relationship: string;
  isOwner?: boolean;
  tastePreference?: string | null;
  dietPreference?: string | null;
  dietaryRestrictions?: string[];
  allergens?: string[];
}

export type UpdateMemberRequest = Partial<CreateMemberRequest>;

export interface FindRecipesRequest {
  timePreference: string;
  memberIds?: string[];
  tastePreference: string;
  preferLikedRecipes?: boolean;
  dietaryExclusions?: string[];
}

export interface RecognizedIngredientCandidate {
  name: string;
  normalizedName: string | null;
  quantity: number | null;
  unit: string | null;
}

export interface RecognizeIngredientsResponse {
  items: RecognizedIngredientCandidate[];
}
