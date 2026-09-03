"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "../context/AppContext";
import { CookSession } from "../components/CookSession";
import { currentlyCookingStorage } from "../services/currentlyCookingStorage";
import { recipeService, type RecipeDetail } from "../services/recipeService";

export function CookModePage() {
  const { recommendedRecipes, consumeOpen, setConsumeOpen, setDialog, go } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const isStored = searchParams.get("isStored") === "true";

  const [dbRecipe, setDbRecipe] = useState<RecipeDetail | null>(null);
  const [dbChecked, setDbChecked] = useState(false);

  useEffect(() => {
    if (!isStored || !id) {
      setDbChecked(true);
      return;
    }
    let cancelled = false;
    setDbChecked(false);
    recipeService
      .getById(id)
      .then((recipe) => {
        if (!cancelled) setDbRecipe(recipe);
      })
      .catch(() => {
        if (!cancelled) setDbRecipe(null);
      })
      .finally(() => {
        if (!cancelled) setDbChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id, isStored]);

  const localRecipe = recommendedRecipes.find((r) => r.id === id);
  const recipe = isStored ? dbRecipe : localRecipe;
  const ready = isStored ? dbChecked : true;

  useEffect(() => {
    if (ready && !recipe) go("home");
  }, [ready, recipe, go]);

  if (!ready || !recipe) return null;

  // Only saved if it isn't already a real, persisted recipe (favorites already are).
  const handleStartConsume = () => {
    if (!isStored) {
      recipeService
        .save({
          id: recipe.id,
          name: recipe.name,
          description: recipe.description,
          difficulty: recipe.difficulty,
          tags: recipe.tags,
          cookTime: recipe.cookTime,
          seasonings: recipe.seasonings,
          steps: recipe.steps,
        })
        .then((saved) => currentlyCookingStorage.set(saved.id))
        .catch(() => {
          // Best-effort: still let the user finish cooking even if saving failed.
        });
    }
    setConsumeOpen(true);
  };

  return (
    <CookSession
      title="一起做吧！"
      sub={`${recipe.name} · 预计 ${recipe.cookTime}`}
      back={() => router.back()}
      showOtherRecipesLink={false}
      onOtherRecipesClick={() => {}}
      steps={recipe.steps ?? []}
      consumeOpen={consumeOpen}
      onStartConsume={handleStartConsume}
      onCloseConsume={() => setConsumeOpen(false)}
      onEndCooking={() => setDialog("确定结束这次制作吗？")}
      onConsumeDone={() => {
        setConsumeOpen(false);
        go("feedback");
      }}
    />
  );
}
