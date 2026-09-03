"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "../context/AppContext";
import { Header } from "../components/Header";
import { RecipeDetail } from "../components/RecipeDetail";
import { recipeService } from "../services/recipeService";

export function RecommendRecipePage() {
  const { recommendedRecipes, setRecommendedRecipes, setLikedRecipes, goBack } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const recipe = recommendedRecipes.find((r) => r.id === id);

  if (!recipe) {
    return (
      <>
        <Header title="菜谱详情" back={() => goBack()} />
        <p>没有找到这道菜谱，可能已经过期，请回到推荐页重新查看。</p>
      </>
    );
  }

  const liked = recipe.isFavorite === true;

  const handleToggleLike = () => {
    const nextIsFavorite = !liked;
    setLikedRecipes((a) =>
      nextIsFavorite ? [...a, recipe.id] : a.filter((x) => x !== recipe.id),
    );
    if (recommendedRecipes.some((r) => r.id === recipe.id)) {
      setRecommendedRecipes(
        recommendedRecipes.map((r) => (r.id === recipe.id ? { ...r, isFavorite: nextIsFavorite } : r)),
      );
    }
    // Best-effort: only updates something server-side if this id is already a real, owned recipe.
    recipeService.updateFavorite(recipe.id, nextIsFavorite).catch(() => {});
  };

  const handleStartCooking = () => {
    // Saving is now deferred to CookModePage's 做好啦 button (only when isStored is false).
    router.push(`/recipes/cookMode?id=${recipe.id}&isStored=${recipe.isStored === true}`);
  };

  return (
    <>
      <Header title="菜谱详情" back={() => goBack()} />
      <RecipeDetail
        recipe={recipe}
        liked={liked}
        onToggleLike={handleToggleLike}
        primaryLabel="就做这道"
        onPrimary={handleStartCooking}
      />
    </>
  );
}
