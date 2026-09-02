"use client";
import { useApp } from "../context/AppContext";
import { Header } from "../components/Header";
import { RecipeDetail, type RecipeDetailData } from "../components/RecipeDetail";

const legacyRecipe: RecipeDetailData = {
  name: "番茄炒蛋",
  cookTime: "15 分钟",
  difficulty: "简单",
  tags: ["家常", "下饭"],
  ingredients: [
    { name: "番茄", quantity: "2 个" },
    { name: "鸡蛋", quantity: "3 个" },
  ],
  seasonings: [
    { name: "盐", quantity: "适量" },
    { name: "食用油", quantity: "适量" },
    { name: "白糖", quantity: "少许" },
  ],
};

export function RecipePage() {
  const { recipeOrigin, liked, setLiked, go, recipeBack } = useApp();
  return (
    <>
      <Header title="菜谱详情" back={recipeBack} />
      <RecipeDetail
        recipe={legacyRecipe}
        liked={liked}
        onToggleLike={() => setLiked(!liked)}
        primaryLabel={recipeOrigin === "recommend" ? "就做这道" : "再做一次"}
        onPrimary={() => go("cook")}
      />
    </>
  );
}
