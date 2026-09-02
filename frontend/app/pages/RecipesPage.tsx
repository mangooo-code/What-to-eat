"use client";
import "../styles/pages/recipes.css";
import "../styles/components/recipe-card.css";
import "../styles/components/tabs.css";
import { useApp } from "../context/AppContext";
import { Header } from "../components/Header";
import { Placeholder } from "../components/Placeholder";
import { AssetImage } from "../components/AssetImage";
import { recipesDone, recipesLiked } from "../lib/data";

export function RecipesPage() {
  const { page, setRecipeOrigin, go, goBack } = useApp();
  const recipeTab: "done" | "liked" = page === "recipesFavorites" ? "liked" : "done";
  const data = recipeTab === "done" ? recipesDone : recipesLiked;
  return (
    <>
      <Header title="我的菜谱" back={() => goBack("profile")} />
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
      {data.length ? <div className="recipe-grid">
        {data.map((x) => (
          <button
            type="button"
            className="saved-card"
            key={x[0]}
            onClick={() => {
              setRecipeOrigin(recipeTab);
              go("recipe");
            }}
          >
            <Placeholder wide />
            <span>
              <strong>{x[0]}</strong>
              <small>{x[1]}</small>
              <em>{x[2]}</em>
              {recipeTab === "liked" && <i>♥ 已喜欢</i>}
            </span>
          </button>
        ))}
      </div> : <div className="recipes-empty"><AssetImage name="empty-recipes-state.png" alt="" className="asset-state" /><h2>{recipeTab === "done" ? "还没有做过的菜谱" : "还没有喜欢的菜谱"}</h2><p>之后的菜谱会出现在这里。</p></div>}
    </>
  );
}
