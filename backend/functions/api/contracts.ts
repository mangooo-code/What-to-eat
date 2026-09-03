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

// Sent when the user finishes cooking a recipe, to deduct the ingredients it used
// from their inventory (matched by name).
export interface ConsumeIngredientItem {
  name: string;
  quantity: number;
}

export interface ConsumeIngredientsRequest {
  items: ConsumeIngredientItem[];
}


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

export interface SaveRecipeIngredientRequest {
  name: string;
  quantity: string;
}

export interface SaveRecipeStepRequest {
  title: string;
  detailedInstructions: string;
  time: number | null;
}

// Sent when the user commits to cooking a recipe surfaced by findrecipes (favorite
// or AI-generated); persists it (if not already a real row) so it has a stable id.
export interface SaveRecipeRequest {
  id: string;
  name: string;
  description?: string | null;
  difficulty?: string | null;
  tags?: string[];
  /** Formatted display string (e.g. "15 分钟"), not raw minutes. */
  cookTime?: string;
  seasonings?: SaveRecipeIngredientRequest[];
  steps?: SaveRecipeStepRequest[];
}

// Sent when the user toggles the 喜欢 (favorite) button on a recipe screen.
export interface UpdateRecipeFavoriteRequest {
  isFavorite: boolean;
}

// Returned by GET /recipes/{id} (e.g. CookModePage's isStored=true lookup).
export interface RecipeDetailResponse {
  id: string;
  name: string;
  description: string | null;
  difficulty: string | null;
  tags: string[];
  /** Formatted display string (e.g. "15 分钟"), not raw minutes. */
  cookTime: string;
  /** From RecipeIngredients; quantity is a real number here (unlike seasonings' free-text amounts). */
  ingredients: Array<{ name: string; quantity: number; unit: string }>;
  seasonings: SaveRecipeIngredientRequest[];
  steps: SaveRecipeStepRequest[];
}

