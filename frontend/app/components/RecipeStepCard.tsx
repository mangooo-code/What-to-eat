"use client";
import "../styles/components/recipe-step-card.css";
import { useEffect, useState } from "react";

export function RecipeStepCard({
  index,
  data,
  timer,
}: {
  index: number;
  data: string[];
  timer: boolean;
}) {
  const initial = index === 2 ? 300 : 180,
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
      setComplete((v) => !v);
    };
  const name = data[0].split("｜")[1] || data[0];
  return (
    <article className={`detail-step ${complete ? "is-complete" : ""}`}>
      <div className="step-number">{index + 1}</div>
      <div className="step-content">
        <div className="step-title">
          <h3>{name}</h3>
          <strong>{data[2]}</strong>
        </div>
        <p>{data[1]}</p>
        {timer && (
          <div className="compact-timer">
            <b role="timer" aria-live="off">
              {String(Math.floor(seconds / 60)).padStart(2, "0")}:
              {String(seconds % 60).padStart(2, "0")}
            </b>
            <span>
              <button type="button" aria-pressed={running} onClick={() => setRunning((v) => !v)}>
                {running ? "暂停" : seconds === 0 ? "时间到啦" : "开始计时"}
              </button>
              <button type="button" onClick={reset}>清零</button>
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
