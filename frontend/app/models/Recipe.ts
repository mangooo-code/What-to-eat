import type { Json } from "./common";

// Mirrors "Recipes" (backend/sql/migrations/20260825084130_InitializeRecipes.sql,
// rating/ratingCount added in 20260826120000_InitializeRecipeRatings.sql)
export interface Recipe {
  id: string;
  time: number | null;
  /** Ordered list of cooking steps; shape defined by application logic, not the database. */
  steps: Json;
  /** Dietary/taste preferences this recipe suits; shape defined by application logic. */
  preferences: Json | null;
  /** Average of "RecipeRatings"."score", rounded to 2 decimal places. */
  rating: number | null;
  ratingCount: number;
}
