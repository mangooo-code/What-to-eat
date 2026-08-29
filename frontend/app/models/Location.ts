// Mirrors "Locations" (backend/sql/migrations/20260824062625_InitializeIngredients.sql,
// userId FK added in 20260825074005_InitializeUsers.sql)
export interface Location {
  id: string;
  /** Parent location id, for nested storage areas (e.g. a shelf inside a fridge). */
  parentLocation: string | null;
  name: string;
  userId: string;
  /** ISO 8601 timestamp. */
  updatedDate: string;
}
