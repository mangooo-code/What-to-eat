"use client";
import "../styles/pages/recipes.css";
import "../styles/components/recipe-card.css";
import "../styles/components/tabs.css";
import "../styles/components/loading.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../context/AppContext";
import { Header } from "../components/Header";
import { Placeholder } from "../components/Placeholder";
import { AssetImage } from "../components/AssetImage";
import { recipeService, type RecipeListItem } from "../services/recipeService";

export function RecipesPage() {
  const { page, go, goBack, recipesListOrigin } = useApp();
  const router = useRouter();
  const recipeTab: "done" | "liked" = page === "recipesFavorites" ? "liked" : "done";

  const [historyRecipes, setHistoryRecipes] = useState<RecipeListItem[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [favoriteRecipes, setFavoriteRecipes] = useState<RecipeListItem[]>([]);
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);

  useEffect(() => {
    if (recipeTab !== "done") return;
    let cancelled = false;
    recipeService
      .list()
      .then((items) => {
        if (!cancelled) setHistoryRecipes(items);
      })
      .catch(() => {
        if (!cancelled) setHistoryRecipes([]);
      })
      .finally(() => {
        if (!cancelled) setHistoryLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [recipeTab]);

  useEffect(() => {
    if (recipeTab !== "liked") return;
    let cancelled = false;
    recipeService
      .listFavorites()
      .then((items) => {
        if (!cancelled) setFavoriteRecipes(items);
      })
      .catch(() => {
        if (!cancelled) setFavoriteRecipes([]);
      })
      .finally(() => {
        if (!cancelled) setFavoritesLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [recipeTab]);

  const loaded = recipeTab === "done" ? historyLoaded : favoritesLoaded;
  const data =
    recipeTab === "done"
      ? historyRecipes.map((item) => ({
          key: item.id,
          name: item.name,
          subtitle: [item.cookTime, item.difficulty].filter(Boolean).join(" · "),
          summary: item.matchSummary,
        }))
      : favoriteRecipes.map((item) => ({
          key: item.id,
          name: item.name,
          subtitle: [item.cookTime, item.difficulty].filter(Boolean).join(" · "),
          summary: item.matchSummary,
        }));

  return (
    <>
      <Header title="我的菜谱" back={() => goBack(recipesListOrigin)} />
      <div className="tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={recipeTab === "done"}
          className={recipeTab === "done" ? "active" : ""}
          onClick={() => go("recipesHistory")}
        >
          历史菜谱
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={recipeTab === "liked"}
          className={recipeTab === "liked" ? "active" : ""}
          onClick={() => go("recipesFavorites")}
        >
          喜欢的菜谱
        </button>
      </div>
      {!loaded ? (
        <div className="center-state" role="status" aria-live="polite">
          <span className="spinner" aria-hidden="true" />
        </div>
      ) : data.length ? <div className="recipe-grid">
        {data.map((x) => (
          <button
            type="button"
            className="saved-card"
            key={x.key}
            onClick={() => {
              router.push(`/recipes/${recipeTab === "done" ? "history" : "favorites"}/currentRecipe?id=${x.key}`);
            }}
          >
            <Placeholder wide />
            <span>
              <strong>{x.name}</strong>
              <small>{x.subtitle}</small>
              <em>{x.summary}</em>
              {recipeTab === "liked" && <i>♥ 已喜欢</i>}
            </span>
          </button>
        ))}
      </div> : <div className="recipes-empty"><AssetImage name="empty-recipes-state.png" alt="" className="asset-state" /><h2>{recipeTab === "done" ? "还没有做过的菜谱" : "还没有喜欢的菜谱"}</h2></div>}
    </>
  );
}
