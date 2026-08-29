import type { Ingredient } from "../../shared/types/domain";

export interface ListIngredientsQuery {
  locationId?: string;
  cursor?: string;
  limit?: number;
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
