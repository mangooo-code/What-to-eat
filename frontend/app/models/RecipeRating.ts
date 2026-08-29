// Mirrors "RecipeRatings" (backend/sql/migrations/20260826120000_InitializeRecipeRatings.sql)
export interface RecipeRating {
  id: string;
  recipeId: string;
  userId: string;
  /** 1-5, enforced by a CHECK constraint in the database. */
  score: number;
  comment: string | null;
  /** ISO 8601 timestamp. */
  createdDate: string;
  /** ISO 8601 timestamp. */
  updatedDate: string;
}
