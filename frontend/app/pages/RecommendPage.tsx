"use client";
import "../styles/pages/recommend.css";
import "../styles/components/recipe-card.css";
import { useApp } from "../context/AppContext";
import { Header } from "../components/Header";
import { Placeholder } from "../components/Placeholder";
import { recipesA, recipesB } from "../lib/data";

export function RecommendPage() {
  const { batch, setBatch, likedRecipes, setLikedRecipes, setRecipeOrigin, go, say } =
    useApp();
  const rs = batch ? recipesB : recipesA;
  return (
    <>
      <Header
        title="今天可以吃这些"
        sub="照着家里的食材和你的想法，我挑了这 3 道。"
        back={() => go("needs")}
      />
      <div className="recipe-grid">
        {rs.map((r, i) => (
          <article className="recipe-card" key={r[0]}>
            <Placeholder wide />
            <div className="recipe-body">
              <div className="heading">
                <h2>{r[0]}</h2>
                <button
                  className="heart"
                  onClick={() =>
                    setLikedRecipes((a) =>
                      a.includes(r[0])
                        ? a.filter((x) => x !== r[0])
                        : [...a, r[0]],
                    )
                  }
                >
                  {likedRecipes.includes(r[0]) ? "♥ 已喜欢" : "♡ 喜欢"}
                </button>
              </div>
              <p>
                {r[1]} ｜ {r[2]}
              </p>
              <div className="tags">
                <span>家常</span>
                <span>{i === 2 ? "热乎" : "下饭"}</span>
              </div>
              <strong className="match">{r[3]}</strong>
              <p>{r[4]}</p>
              <button
                className="secondary"
                onClick={() => {
                  setRecipeOrigin("recommend");
                  go("recipe");
                }}
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
        <button className="link" onClick={() => go("needs")}>
          调整需求
        </button>
      </div>
    </>
  );
}
