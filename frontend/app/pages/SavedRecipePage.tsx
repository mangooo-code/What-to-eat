"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "../components/Header";
import { RecipeDetail } from "../components/RecipeDetail";
import { recipeService, type RecipeDetail as RecipeDetailDto } from "../services/recipeService";

// Shared by /recipes/history/currentRecipe and /recipes/favorites/currentRecipe: both list
// only ever surface real, persisted Recipes rows, so this always fetches by id (no localStorage fallback).
export function SavedRecipePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [recipe, setRecipe] = useState<RecipeDetailDto | null>(null);
  const [liked, setLiked] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoaded(true);
      return;
    }
    let cancelled = false;
    recipeService
      .getById(id)
      .then((detail) => {
        if (cancelled) return;
        setRecipe(detail);
        setLiked(detail.isFavorite);
      })
      .catch(() => {
        if (!cancelled) setRecipe(null);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!loaded) return null;

  if (!recipe) {
    return (
      <>
        <Header title="菜谱详情" back={() => router.back()} />
        <p>没有找到这道菜谱，可能已经被删除。</p>
      </>
    );
  }

  const handleToggleLike = () => {
    const next = !liked;
    setLiked(next);
    recipeService.updateFavorite(recipe.id, next).catch(() => {});
  };

  return (
    <>
      <Header title="菜谱详情" back={() => router.back()} />
      <RecipeDetail
        recipe={{
          ...recipe,
          description: recipe.description ?? "",
          difficulty: recipe.difficulty ?? "",
          ingredients: recipe.ingredients.map((item) => ({
            name: item.name,
            quantity: `${item.quantity} ${item.unit}`.trim(),
          })),
        }}
        liked={liked}
        onToggleLike={handleToggleLike}
        primaryLabel="再做一次"
        onPrimary={() => router.push(`/recipes/cookMode?id=${recipe.id}&isStored=true`)}
      />
    </>
  );
}
