"use client";
import { useSearchParams } from "next/navigation";
import { useApp } from "../context/AppContext";
import { Header } from "../components/Header";
import { RecipeDetail } from "../components/RecipeDetail";

export function RecommendRecipePage() {
  const { recommendedRecipes, likedRecipes, setLikedRecipes, go, goBack } = useApp();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const recipe = recommendedRecipes.find((r) => r.id === id);

  if (!recipe) {
    return (
      <>
        <Header title="菜谱详情" back={() => goBack("recommend")} />
        <p>没有找到这道菜谱，可能已经过期，请回到推荐页重新查看。</p>
      </>
    );
  }

  return (
    <>
      <Header title="菜谱详情" back={() => goBack("recommend")} />
      <RecipeDetail
        recipe={recipe}
        liked={likedRecipes.includes(recipe.id)}
        onToggleLike={() =>
          setLikedRecipes((a) =>
            a.includes(recipe.id) ? a.filter((x) => x !== recipe.id) : [...a, recipe.id],
          )
        }
        primaryLabel="就做这道"
        onPrimary={() => go("cook")}
      />
    </>
  );
}
