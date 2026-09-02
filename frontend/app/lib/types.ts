export type Page =
  | "login"
  | "home"
  | "fridge"
  | "edit"
  | "capture"
  | "recognize"
  | "confirm"
  | "findrecipes"
  | "member"
  | "recommend"
  | "recipe"
  | "cook"
  | "feedback"
  | "profile"
  | "diet"
  | "recipesHistory"
  | "recipesFavorites";

export type Food = {
  id?: string;
  name: string;
  qty: number | string;
  unit: string;
  place: string;
  days: number | null;
  normalizedName?: string | null;
  unitTypeId?: number;
  locationId?: string;
  expiryDate?: string | null;
  imageFileId?: string | null;
  source?: "manual" | "recognition" | "import";
  createdDate?: string;
  updatedDate?: string;
};

export type ProfileData = {
  taste: string;
  diet: string;
  limits: string[];
  allergens: string[];
};
