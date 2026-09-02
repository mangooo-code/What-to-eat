"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import "../styles/pages/recommend.css";
import "../styles/components/recipe-card.css";
import { useApp } from "../context/AppContext";
import { Header } from "../components/Header";
import { Placeholder } from "../components/Placeholder";

export function RecommendPage() {
  const { recommendedRecipes, setBatch, likedRecipes, setLikedRecipes, go, goBack, say } = useApp();
  const router = useRouter();
  useEffect(() => {
    if (recommendedRecipes.length === 0) go("findrecipes");
  }, [recommendedRecipes, go]);
  if (recommendedRecipes.length === 0) return null;
  return (
    <>
      <Header
        title="今天可以吃这些"
        sub="照着家里的食材和你的想法，我挑了这 3 道。"
        back={() => goBack("findrecipes")}
      />
      <div className="recipe-grid recommend-grid">
        {recommendedRecipes.map((r) => (
          <article className="recipe-card" key={r.id}>
            <Placeholder wide />
            <div className="recipe-body">
              <div className="heading">
                <h2>{r.name}</h2>
                <button
                  type="button"
                  className="heart"
                  aria-pressed={likedRecipes.includes(r.id)}
                  onClick={() =>
                    setLikedRecipes((a) =>
                      a.includes(r.id)
                        ? a.filter((x) => x !== r.id)
                        : [...a, r.id],
                    )
                  }
                >
                  {likedRecipes.includes(r.id) ? "♥ 已喜欢" : "♡ 喜欢"}
                </button>
              </div>
              <p>
                {r.cookTime} ｜ {r.difficulty}
              </p>
              {r.tags.length > 0 && (
                <div className="tags">
                  {r.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              )}
              <strong className="match">{r.matchSummary}</strong>
              <p>{r.description}</p>
              <button
                className="secondary"
                onClick={() => router.push(`/recipes/recommendations/recipe?id=${r.id}`)}
              >
                查看菜谱
              </button>
            </div>
          </article>
        ))}
      </div>
      <div className="bottom-question">
        <p>都没看上？</p>
        <button
          className="secondary"
          onClick={() => {
            say("没事，我再帮你挑几道。");
            setTimeout(() => setBatch(1), 800);
          }}
        >
          换一批
        </button>
        <button className="link" onClick={() => go("findrecipes")}>
          调整需求
        </button>
      </div>
    </>
  );
}
