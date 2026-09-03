"use client";
import "../styles/components/recipe-step-card.css";
import { useEffect, useState } from "react";
import type { RecipeStepDto } from "../services/findRecipesService";

export function RecipeStepCard({
  index,
  step,
  timer,
}: {
  index: number;
  step: RecipeStepDto;
  timer: boolean;
}) {
  const initial = (step.time ?? 3) * 60,
    [complete, setComplete] = useState(false),
    [running, setRunning] = useState(false),
    [seconds, setSeconds] = useState(initial);
  useEffect(() => {
    if (!running || seconds <= 0) return;
    const id = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [running, seconds]);
  const reset = () => {
      setRunning(false);
      setSeconds(initial);
    },
    toggleComplete = () => {
      if (complete) reset();
      else setRunning(false);
      setComplete((v) => !v);
    };
  return (
    <article className={`detail-step ${complete ? "is-complete" : ""}`}>
      <div className="step-number">{index + 1}</div>
      <div className="step-content">
        <div className="step-title">
          <h3>{step.title}</h3>
          {step.time !== null && <strong>{step.time} 分钟</strong>}
        </div>
        <p>{step.detailedInstructions}</p>
        {timer && (
          <div className="compact-timer">
            <b role="timer" aria-live="off">
              {String(Math.floor(seconds / 60)).padStart(2, "0")}:
              {String(seconds % 60).padStart(2, "0")}
            </b>
            <span>
              <button type="button" aria-pressed={running} disabled={complete} onClick={() => setRunning((v) => !v)}>
                {running ? "暂停" : seconds === 0 ? "时间到啦" : "开始计时"}
              </button>
              <button type="button" disabled={complete} onClick={reset}>清零</button>
            </span>
          </div>
        )}
        <button className="complete-action" aria-pressed={complete} onClick={toggleComplete}>
          {complete ? "✓ 已完成 · 重新打开" : "标记已完成"}
        </button>
      </div>
    </article>
  );
}

