"use client";
import { useApp } from "../context/AppContext";
import { CookSession } from "../components/CookSession";

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
    <CookSession
      title="一起做吧！"
      sub="番茄炒蛋 · 预计 15 分钟"
      back={recipeBack}
      showOtherRecipesLink={recipeOrigin === "recommend"}
      onOtherRecipesClick={() => go("recommend")}
      consumeOpen={consumeOpen}
      onStartConsume={() => setConsumeOpen(true)}
      onCloseConsume={() => setConsumeOpen(false)}
      onEndCooking={() => setDialog("确定结束这次制作吗？")}
      onConsumeDone={(tomato, egg) => {
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
  );
}
