"use client";
import { useSearchParams } from "next/navigation";
import { useApp } from "../context/AppContext";
import { Header } from "../components/Header";
import { RecipeDetail } from "../components/RecipeDetail";
import { currentlyCookingStorage } from "../services/currentlyCookingStorage";
import { recipeService } from "../services/recipeService";

export function RecommendRecipePage() {
  const { recommendedRecipes, setRecommendedRecipes, setLikedRecipes, go, goBack } = useApp();
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

  const handleStartCooking = async () => {
    try {
      const saved = await recipeService.save({
        id: recipe.id,
        name: recipe.name,
        description: recipe.description,
        difficulty: recipe.difficulty,
        tags: recipe.tags,
        cookTime: recipe.cookTime,
        seasonings: recipe.seasonings,
        steps: recipe.steps,
      });
      currentlyCookingStorage.set(saved.id);
    } catch {
      // Best-effort: still let the user proceed to cook even if saving failed.
    }
    go("cook");
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
