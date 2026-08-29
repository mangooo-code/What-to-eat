export type Page =
  | "login"
  | "home"
  | "fridge"
  | "edit"
  | "capture"
  | "recognize"
  | "confirm"
  | "needs"
  | "member"
  | "recommend-loading"
  | "recommend"
  | "recipe"
  | "cook"
  | "feedback"
  | "profile"
  | "diet"
  | "recipes";

export type Food = {
  id?: string;
  name: string;
  qty: number | string;
  unit: string;
  place: string;
  days: number;
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
