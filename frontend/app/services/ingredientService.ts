import { apiClient } from "./apiClient";
import type { IngredientUnitType } from "../types/domain";

export const ingredientService = {
  listUnitTypes: () => apiClient.get<IngredientUnitType[]>("/ingredients/units"),
};
