import { apiClient } from "./apiClient";
import type { Ingredient, IngredientSource, IngredientUnitType, InventoryLocation } from "../types/domain";

export interface ListIngredientsParams {
  locationId?: string;
  cursor?: string;
  limit?: number;
}

export interface CreateIngredientInput {
  name: string;
  normalizedName?: string | null;
  quantity: number;
  unitTypeId: number;
  locationId: string;
  expiryDate?: string | null;
  imageFileId?: string | null;
  source?: IngredientSource;
}

export type UpdateIngredientInput = Partial<CreateIngredientInput>;

export interface InventorySnapshot {
  items: Ingredient[];
  locations: InventoryLocation[];
  unitTypes: IngredientUnitType[];
}

export const inventoryService = {
  list: (params: ListIngredientsParams = {}) => apiClient.get<InventorySnapshot>("/inventory", {
    query: {
      locationId: params.locationId,
      cursor: params.cursor,
      limit: params.limit,
    },
  }),
  exists: () => apiClient.get<{ hasItems: boolean }>("/inventory/exists"),
  create: (input: CreateIngredientInput) => apiClient.post<Ingredient, CreateIngredientInput>("/inventory", input),
  update: (id: string, input: UpdateIngredientInput) => apiClient.patch<Ingredient, UpdateIngredientInput>(`/inventory/${encodeURIComponent(id)}`, input),
  remove: (id: string) => apiClient.delete<void>(`/inventory/${encodeURIComponent(id)}`),
};
