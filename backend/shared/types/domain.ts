export interface User {
  id: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  phoneNumber: string;
  displayName: string;
  avatarFileId: string | null;
}

export interface HouseholdMember {
  memberId: string;
  ownerUserId: string;
  name: string;
  relationship: string;
  isOwner: boolean;
  tastePreference: string | null;
  dietPreference: string | null;
  dietaryRestrictions: string[];
  allergens: string[];
  createdDate: string;
  updatedDate: string;
}

export interface Ingredient {
  id: string;
  ownerUserId: string;
  name: string;
  normalizedName: string | null;
  quantity: number;
  unitTypeId: number;
  locationId: string;
  expiryDate: string | null;
  imageFileId: string | null;
  source: "manual" | "recognition" | "import";
  createdDate: string;
  updatedDate: string;
}

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

export interface Recipe {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  /** Estimated total cook time, in minutes. */
  time: number | null;
  difficulty: string | null;
  imageFileId: string | null;
  tags: string[];
  substitutions: string[];
  /** Dietary/taste preferences this recipe suits; shape defined by application logic. */
  preferences: Json | null;
  isFavorite: boolean;
  source: "curated" | "ai_generated";
  /** Average of "RecipeRatings"."score", rounded to 2 decimal places. */
  rating: number | null;
  ratingCount: number;
  createdDate: string;
  updatedDate: string;
}

export interface RecipeIngredient {
  id: number;
  recipeId: string;
  /** References a specific user's inventory row; null for AI-generated recipes with no inventory link. */
  ingredientId: string | null;
  /** Ingredient name captured at recipe-creation time, independent of the live inventory row. */
  nameSnapshot: string | null;
  unitTypeId: number | null;
  quantity: number;
  isOptional: boolean;
}

export interface RecipeStep {
  id: string;
  recipeId: string;
  stepNumber: number;
  title: string;
  detailedInstructions: string;
  /** Estimated time for this step, in minutes. */
  time: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface RecipeSeasoning {
  id: string;
  recipeId: string;
  name: string;
  /** Free-text amount ("适量"/"少许"); it's a feeling, not a number. */
  quantity: string | null;
  createdAt: string;
  updatedAt: string;
}
