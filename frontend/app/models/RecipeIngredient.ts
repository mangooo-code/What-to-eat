// Mirrors "RecipeIngredients" (backend/sql/migrations/20260825084130_InitializeRecipes.sql)
export interface RecipeIngredient {
  id: number;
  recipeId: string;
  ingredientId: string;
  quantity: number;
}
