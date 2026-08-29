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
  name: string;
  qty: number | string;
  unit: string;
  place: string;
  days: number;
};

export type ProfileData = {
  taste: string;
  diet: string;
  limits: string[];
  allergens: string[];
};
