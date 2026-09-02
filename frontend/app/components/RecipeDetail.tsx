"use client";
import "../styles/pages/recipe.css";
import { FoodEmoji } from "./FoodEmoji";
import { Placeholder } from "./Placeholder";
import type { RecipeDto } from "../services/findRecipesService";

export type RecipeDetailData = Pick<RecipeDto, "name" | "cookTime" | "difficulty"> &
  Partial<Pick<RecipeDto, "tags" | "description" | "ingredients" | "seasonings" | "steps">>;

export function RecipeDetail({
  recipe,
  liked,
  onToggleLike,
  primaryLabel,
  onPrimary,
}: {
  recipe: RecipeDetailData;
  liked: boolean;
  onToggleLike: () => void;
  primaryLabel: string;
  onPrimary: () => void;
}) {
  return (
    <>
      <Placeholder wide />
      <div className="recipe-title">
        <div>
          <h1>{recipe.name}</h1>
          <p>
            {recipe.cookTime}｜{recipe.difficulty}
            {recipe.tags?.length ? ` · ${recipe.tags.join(" · ")}` : ""}
          </p>
        </div>
        <button className="heart" type="button" aria-pressed={liked} onClick={onToggleLike}>
          {liked ? "♥ 已喜欢" : "♡ 喜欢"}
        </button>
      </div>
      {recipe.description && <p>{recipe.description}</p>}
      <section className="block ingredients">
        <h2>准备这些就够了</h2>
        <div className="ingredient-groups">
          <div>
            <h3>食材</h3>
            <div className="mini-cards">
              {recipe.ingredients?.length ? (
                recipe.ingredients.map((item) => (
                  <span key={item.name}>
                    <FoodEmoji name={item.name} />
                    <em>{item.name}</em>
                    <b>{item.quantity}</b>
                  </span>
                ))
              ) : (
                <span>暂无食材信息</span>
              )}
            </div>
          </div>
          <div>
            <h3>调料</h3>
            <div className="mini-cards">
              {recipe.seasonings?.length ? (
                recipe.seasonings.map((item) => (
                  <span key={item.name}>
                    <FoodEmoji name={item.name} />
                    <em>{item.name}</em>
                    <b>{item.quantity}</b>
                  </span>
                ))
              ) : (
                <span>暂无调料信息</span>
              )}
            </div>
          </div>
        </div>
      </section>
      {recipe.steps?.length ? (
        <section className="block steps">
          <h2>制作步骤</h2>
          <ol className="recipe-step-list">
            {recipe.steps.map((step, index) => (
              <li key={`${step.title}-${index}`}>
                <div className="step-title">
                  <h3>{step.title}</h3>
                  {step.time !== null && <strong>{step.time} 分钟</strong>}
                </div>
                <p>{step.detailedInstructions}</p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
      <button className="primary sticky" onClick={onPrimary}>
        {primaryLabel}
      </button>
    </>
  );
}
