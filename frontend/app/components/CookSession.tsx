"use client";
import "../styles/pages/cook.css";
import "../styles/components/recipe-step-card.css";
import { Consume, type ConsumeIngredient } from "./Consume";
import { Header } from "./Header";
import { RecipeStepCard } from "./RecipeStepCard";
import type { RecipeStepDto } from "../services/findRecipesService";

export function CookSession({
  title,
  sub,
  back,
  showOtherRecipesLink,
  onOtherRecipesClick,
  steps,
  ingredients,
  consumeOpen,
  onStartConsume,
  onCloseConsume,
  onEndCooking,
  onConsumeDone,
}: {
  title: string;
  sub: string;
  back: () => void;
  showOtherRecipesLink: boolean;
  onOtherRecipesClick: () => void;
  steps: RecipeStepDto[];
  ingredients: ConsumeIngredient[];
  consumeOpen: boolean;
  onStartConsume: () => void;
  onCloseConsume: () => void;
  onEndCooking: () => void;
  onConsumeDone: (consumed: Array<{ name: string; quantity: number }>) => void;
}) {
  return (
    <>
      <Header title={title} sub={sub} back={back} />
      {showOtherRecipesLink && (
        <button className="link cook-back" onClick={onOtherRecipesClick}>
          ‹ 看看其他菜谱
        </button>
      )}
      {steps.length > 0 && (
        <section className="block steps">
          <h2>制作步骤</h2>
          <ol className="recipe-step-list">
            {steps.map((step, index) => (
              <li key={`${step.title}-${index}`}>
                <RecipeStepCard index={index} step={step} timer />
              </li>
            ))}
          </ol>
        </section>
      )}
      <div className="sticky-actions">
        <button className="primary" onClick={onStartConsume}>
          做好啦
        </button>
        <button className="danger-link" onClick={onEndCooking}>
          结束制作
        </button>
      </div>
      {consumeOpen && (
        <div className="overlay" role="dialog" aria-modal="true" aria-label="确认食材消耗">
          <div className="consume-modal">
            <button
              className="modal-close"
              aria-label="关闭"
              onClick={onCloseConsume}
            >
              ×
            </button>
            <Consume ingredients={ingredients} onDone={onConsumeDone} />
          </div>
        </div>
      )}
    </>
  );
}
