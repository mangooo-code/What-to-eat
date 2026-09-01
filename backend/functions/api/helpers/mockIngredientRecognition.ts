import type { RecognizeIngredientsResponse } from "../contracts";

export const mockIngredientRecognition: RecognizeIngredientsResponse = {
  items: [
    {
      name: "番茄",
      normalizedName: "番茄",
      quantity: 2,
      unit: "个",
    },
    {
      name: "鸡蛋",
      normalizedName: "鸡蛋",
      quantity: 1,
      unit: "盒",
    },
  ],
};
