"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "../context/AppContext";
import { CookSession } from "../components/CookSession";
import { currentlyCookingStorage } from "../services/currentlyCookingStorage";
import { inventoryService } from "../services/inventoryService";
import { recipeService, type RecipeDetail } from "../services/recipeService";

// Best-effort: splits a free-text quantity like "2 个"/"300 克" into a leading number
// and the remaining unit text; amounts with no leading number (e.g. "适量") become
// quantity 0 with the whole string kept as the "unit" label.
function splitQuantity(raw: string): { quantity: number; unit: string } {
  const match = raw.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
  if (match) return { quantity: Number(match[1]), unit: match[2].trim() };
  return { quantity: 0, unit: raw.trim() };
}

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

  // isStored=true: the recipe is a real row, so its required ingredients (with unit) live in
  // RecipeIngredients, returned as-is by GET /recipes/{id}.
  // isStored=false: it's only ever been AI-generated, so its ingredients (free-text quantity
  // strings like "2 个") live in the localStorage-backed recommendedRecipes entry.
  const consumeIngredients = isStored
    ? (dbRecipe?.ingredients ?? [])
    : (localRecipe?.ingredients ?? []).map((item) => ({ name: item.name, ...splitQuantity(item.quantity) }));

  // Only saved if it isn't already a real, persisted recipe (favorites already are).
  const handleConsumeDone = async (consumed: Array<{ name: string; quantity: number }>) => {
    if (!isStored) {
      await recipeService
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
    const items = consumed.filter((item) => item.quantity > 0);
    if (items.length) {
      await inventoryService.consume(items).catch(() => {
        // Best-effort: don't block finishing the cook if the deduction fails.
      });
    }
    setConsumeOpen(false);
    go("feedback");
  };

  return (
    <CookSession
      title="一起做吧！"
      sub={`${recipe.name} · 预计 ${recipe.cookTime}`}
      back={() => router.back()}
      showOtherRecipesLink={false}
      onOtherRecipesClick={() => {}}
      steps={recipe.steps ?? []}
      ingredients={consumeIngredients}
      consumeOpen={consumeOpen}
      onStartConsume={() => setConsumeOpen(true)}
      onCloseConsume={() => setConsumeOpen(false)}
      onEndCooking={() => setDialog("确定结束这次制作吗？")}
      onConsumeDone={handleConsumeDone}
    />
  );
}
