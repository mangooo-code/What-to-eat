"use client";
import "../styles/pages/cook.css";
import { useApp } from "../context/AppContext";
import { Consume } from "../components/Consume";
import { Header } from "../components/Header";

export function CookPage() {
  const {
    recipeOrigin,
    go,
    recipeBack,
    consumeOpen,
    setConsumeOpen,
    setFoods,
    setDialog,
  } = useApp();
  return (
    <>
      <Header title="一起做吧！" sub="番茄炒蛋 · 预计 15 分钟" back={recipeBack} />
      {recipeOrigin === "recommend" && (
        <button className="link cook-back" onClick={() => go("recommend")}>
          ‹ 看看其他菜谱
        </button>
      )}
      <div className="sticky-actions">
        <button className="primary" onClick={() => setConsumeOpen(true)}>
          做好啦
        </button>
        <button
          className="danger-link"
          onClick={() => setDialog("确定结束这次制作吗？")}
        >
          结束制作
        </button>
      </div>
      {consumeOpen && (
        <div className="overlay" role="dialog" aria-modal="true" aria-label="确认食材消耗">
          <div className="consume-modal">
            <button
              className="modal-close"
              aria-label="关闭"
              onClick={() => setConsumeOpen(false)}
            >
              ×
            </button>
            <Consume
              onDone={(tomato, egg) => {
                setFoods((a) =>
                  a.flatMap((f) =>
                    f.name === "番茄"
                      ? tomato >= Number(f.qty)
                        ? []
                        : [{ ...f, qty: Number(f.qty) - tomato }]
                      : f.name === "鸡蛋"
                        ? [{ ...f, qty: Math.max(0, Number(f.qty) - egg) }]
                        : [f],
                  ),
                );
                setConsumeOpen(false);
                go("feedback");
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
