export interface User {
  id: string;
  phoneNumber: string;
  displayName: string | null;
  avatarFileId: string | null;
  createdDate: string;
  updatedDate: string;
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
  createdDate: string;
  updatedDate: string;
}

export interface Ingredient {
  id: string;
  ownerUserId: string;
  name: string;
  normalizedName: string | null;
  quantity: number;
  unitTypeId: number;
  locationId: string;
  expiryDate: string | null;
  imageFileId: string | null;
  source: "manual" | "recognition" | "import";
  createdDate: string;
  updatedDate: string;
}
