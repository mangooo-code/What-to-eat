import type { Ingredient } from "../types/domain";
import { postgrestRequest } from "./postgrestClient";

export type LocationKey = "fridge" | "freezer" | "pantry";

export interface LocationDto {
  id: string;
  key: LocationKey;
  name: string;
}

export interface UnitTypeDto {
  id: number;
  name: string;
}

interface IngredientRow {
  id: string;
  userId: string;
  name: string;
  normalizedName: string | null;
  quantity: string;
  unitTypeId: number;
  locationId: string;
  expiryDate: string | null;
  imageFileId: string | null;
  source: Ingredient["source"];
  createdDate: string;
  updatedDate: string;
}

interface LocationRow {
  id: string;
  key: LocationKey;
  name: string;
}

export interface CreateIngredientRecord {
  name: string;
  normalizedName: string | null;
  quantity: number;
  unitTypeId: number;
  locationId: string;
  expiryDate: string | null;
  imageFileId: string | null;
  source: Ingredient["source"];
}

export type UpdateIngredientRecord = Partial<CreateIngredientRecord>;

function mapIngredient(row: IngredientRow): Ingredient {
  return {
    id: row.id,
    ownerUserId: row.userId,
    name: row.name,
    normalizedName: row.normalizedName,
    quantity: Number(row.quantity),
    unitTypeId: row.unitTypeId,
    locationId: row.locationId,
    expiryDate: row.expiryDate,
    imageFileId: row.imageFileId,
    source: row.source,
    createdDate: row.createdDate,
    updatedDate: row.updatedDate,
  };
}

const ingredientColumns = [
  "id", "userId", "name", "normalizedName", "quantity", "unitTypeId",
  "locationId", "expiryDate", "imageFileId", "source", "createdDate", "updatedDate",
].join(",");

export async function listIngredients(userId: string): Promise<Ingredient[]> {
  const rows = await postgrestRequest<IngredientRow[]>("Ingredients", {
    query: { select: ingredientColumns, userId: `eq.${userId}`, order: "updatedDate.desc,id.asc" },
  });
  return rows.map(mapIngredient);
}

// Cheaper than listIngredients() for callers that only need a yes/no answer.
export async function hasAnyIngredients(userId: string): Promise<boolean> {
  const rows = await postgrestRequest<Array<{ id: string }>>("Ingredients", {
    query: { select: "id", userId: `eq.${userId}`, limit: 1 },
  });
  return rows.length > 0;
}

export async function listLocations(userId: string): Promise<LocationDto[]> {
  return postgrestRequest<LocationRow[]>("Locations", {
    query: { select: "id,key,name", userId: `eq.${userId}`, key: "in.(fridge,freezer,pantry)", order: "key.asc" },
  });
}

export async function listUnitTypes(): Promise<UnitTypeDto[]> {
  return postgrestRequest<UnitTypeDto[]>("IngredientUnitTypes", {
    query: { select: "id,name", order: "id.asc" },
  });
}

export async function locationBelongsToUser(locationId: string, userId: string): Promise<boolean> {
  const rows = await postgrestRequest<Array<{ id: string }>>("Locations", {
    query: { select: "id", id: `eq.${locationId}`, userId: `eq.${userId}`, limit: 1 },
  });
  return rows.length > 0;
}

export async function createIngredient(userId: string, input: CreateIngredientRecord): Promise<Ingredient> {
  const rows = await postgrestRequest<IngredientRow[]>("Ingredients", {
    method: "POST",
    query: { select: ingredientColumns },
    prefer: "return=representation",
    body: { userId, ...input },
  });
  return mapIngredient(rows[0]);
}

export async function updateIngredient(
  id: string,
  userId: string,
  input: UpdateIngredientRecord,
): Promise<Ingredient | null> {
  const entries = Object.entries(input).filter(([, value]) => value !== undefined);
  if (!entries.length) {
    const rows = await postgrestRequest<IngredientRow[]>("Ingredients", {
      query: { select: ingredientColumns, id: `eq.${id}`, userId: `eq.${userId}`, limit: 1 },
    });
    return rows[0] ? mapIngredient(rows[0]) : null;
  }
  const rows = await postgrestRequest<IngredientRow[]>("Ingredients", {
    method: "PATCH",
    query: { select: ingredientColumns, id: `eq.${id}`, userId: `eq.${userId}` },
    prefer: "return=representation",
    body: { ...Object.fromEntries(entries), updatedDate: new Date().toISOString() },
  });
  return rows[0] ? mapIngredient(rows[0]) : null;
}

export async function deleteIngredient(id: string, userId: string): Promise<boolean> {
  const rows = await postgrestRequest<Array<{ id: string }>>("Ingredients", {
    method: "DELETE",
    query: { select: "id", id: `eq.${id}`, userId: `eq.${userId}` },
    prefer: "return=representation",
  });
  return rows.length > 0;
}

// Deducts `quantityUsed` from the user's inventory rows matching `name` (compared via
// normalizedName/name, trimmed+lowercased, same convention as recipeRepository's ingredient
// matching). Consumes the smallest rows first; a row hitting 0 is deleted outright rather than
// left at 0. If the amount used exceeds a single row's quantity, the remainder recurses onto
// the next matching row, until either it's fully accounted for or no matching rows remain.
export async function consumeIngredientByName(userId: string, name: string, quantityUsed: number): Promise<void> {
  const target = name.trim().toLowerCase();
  const rows = await postgrestRequest<IngredientRow[]>("Ingredients", {
    query: { select: ingredientColumns, userId: `eq.${userId}`, order: "quantity.asc" },
  });
  const matches = rows.filter((row) => (row.normalizedName ?? row.name).trim().toLowerCase() === target);

  let remaining = quantityUsed;
  for (const row of matches) {
    if (remaining <= 0) break;
    const available = Number(row.quantity);
    if (available <= remaining) {
      await deleteIngredient(row.id, userId);
      remaining -= available;
    } else {
      await postgrestRequest("Ingredients", {
        method: "PATCH",
        query: { id: `eq.${row.id}`, userId: `eq.${userId}` },
        body: { quantity: available - remaining, updatedDate: new Date().toISOString() },
      });
      remaining = 0;
    }
  }
}
