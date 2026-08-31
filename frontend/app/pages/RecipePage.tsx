"use client";
import "../styles/pages/recipe.css";
import { useApp } from "../context/AppContext";
import { Header } from "../components/Header";
import { Placeholder } from "../components/Placeholder";
import { FoodEmoji } from "../components/FoodEmoji";
import { steps } from "../lib/data";

export function RecipePage() {
  const { recipeOrigin, liked, setLiked, go, recipeBack } = useApp();
  return (
    <>
      <Header title="菜谱详情" back={recipeBack} />
      <Placeholder wide />
      <div className="recipe-title">
        <div>
          <h1>番茄炒蛋</h1>
          <p>15 分钟｜简单 · 家常｜下饭</p>
        </div>
        <button className="heart" type="button" aria-pressed={liked} onClick={() => setLiked(!liked)}>
          {liked ? "♥ 已喜欢" : "♡ 喜欢"}
        </button>
      </div>
      <section className="block ingredients">
        <h2>准备这些就够了</h2>
        <div className="ingredient-groups">
          <div>
            <h3>家里已有</h3>
            <div className="mini-cards">
              <span>
                <FoodEmoji name="番茄" />
                <em>番茄</em>
                <b>2 个</b>
              </span>
              <span>
                <FoodEmoji name="鸡蛋" />
                <em>鸡蛋</em>
                <b>3 个</b>
              </span>
            </div>
          </div>
          <div>
            <h3>需要补充</h3>
            <div className="mini-cards">
              <span>无需补充主要食材</span>
            </div>
          </div>
          <div>
            <h3>调料</h3>
            <div className="mini-cards">
              <span>
                <FoodEmoji name="盐" />
                <em>盐</em>
                <b>适量</b>
              </span>
              <span>
                <FoodEmoji name="食用油" />
                <em>食用油</em>
                <b>适量</b>
              </span>
              <span>
                <FoodEmoji name="白糖" />
                <em>白糖</em>
                <b>少许</b>
              </span>
            </div>
          </div>
          <div>
            <h3>可替换食材</h3>
            <div className="mini-cards">
              <span>暂无需要替换的食材</span>
            </div>
          </div>
        </div>
      </section>
      <section className="block recipe-steps">
        <h2>制作步骤</h2>
        <div className="step-list preview-steps">
          {steps.map((s, i) => (
            <article className="step-preview" key={s[0]}>
              <span>{i + 1}</span>
              <strong>{s[0].split("｜")[1]}</strong>
              <small>{s[2]}</small>
            </article>
          ))}
        </div>
      </section>
      <button className="primary sticky" onClick={() => go("cook")}>
        {recipeOrigin === "recommend" ? "就做这道" : "再做一次"}
      </button>
    </>
  );
}
