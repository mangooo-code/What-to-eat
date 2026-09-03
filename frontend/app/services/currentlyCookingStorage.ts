const CURRENTLY_COOKING_KEY = "wte_currently_cooking";

export const currentlyCookingStorage = {
  get(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(CURRENTLY_COOKING_KEY);
  },
  set(recipeId: string): void {
    localStorage.setItem(CURRENTLY_COOKING_KEY, recipeId);
  },
  clear(): void {
    localStorage.removeItem(CURRENTLY_COOKING_KEY);
  },
};
