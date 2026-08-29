export type IsoDateTime = string;

export interface User {
  id: string;
  phoneNumber: string;
  displayName: string | null;
  avatarFileId: string | null;
  createdDate: IsoDateTime;
  updatedDate: IsoDateTime;
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
  createdDate: IsoDateTime;
  updatedDate: IsoDateTime;
}

export type IngredientSource = "manual" | "recognition" | "import";

export interface Ingredient {
  id: string;
  ownerUserId: string;
  name: string;
  normalizedName: string | null;
  quantity: number;
  unitTypeId: number;
  locationId: string;
  expiryDate: IsoDateTime | null;
  imageFileId: string | null;
  source: IngredientSource;
  createdDate: IsoDateTime;
  updatedDate: IsoDateTime;
}

export type LocationKey = "fridge" | "freezer" | "pantry";

export interface InventoryLocation {
  id: string;
  key: LocationKey;
  name: string;
}

export interface IngredientUnitType {
  id: number;
  name: string;
}
