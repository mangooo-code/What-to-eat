// Mirrors "Ingredients" (backend/sql/migrations/20260824062625_InitializeIngredients.sql,
// userId FK added in 20260825074005_InitializeUsers.sql)
export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unitTypeId: number;
  locationId: string;
  userId: string;
  /** ISO 8601 timestamp, or null if the ingredient has no expiry. */
  expiryDate: string | null;
  /** ISO 8601 timestamp. */
  updatedDate: string;
}
