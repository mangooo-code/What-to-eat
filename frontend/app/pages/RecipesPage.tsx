"use client";
import "../styles/pages/recipes.css";
import "../styles/components/recipe-card.css";
import "../styles/components/tabs.css";
import { useApp } from "../context/AppContext";
import { Header } from "../components/Header";
import { Placeholder } from "../components/Placeholder";
import { recipesDone, recipesLiked } from "../lib/data";

export function RecipesPage() {
  const { recipeTab, setRecipeTab, setRecipeOrigin, go } = useApp();
  const data = recipeTab === "done" ? recipesDone : recipesLiked;
  return (
    <>
      <Header title="我的菜谱" back={() => go("profile")} />
      <div className="tabs">
        <button
          type="button"
          className={recipeTab === "done" ? "active" : ""}
          onClick={() => setRecipeTab("done")}
        >
          历史菜谱
        </button>
        <button
          type="button"
          className={recipeTab === "liked" ? "active" : ""}
          onClick={() => setRecipeTab("liked")}
        >
          喜欢的菜谱
        </button>
      </div>
      <div className="recipe-grid">
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
      </div>
    </>
  );
}
