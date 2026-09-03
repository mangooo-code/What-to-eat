"use client";
import { useApp } from "../context/AppContext";
import { CookSession } from "../components/CookSession";

const legacySteps = [
  { title: "准备食材", detailedInstructions: "番茄切成小块。鸡蛋打入磐中，加少量盐搅匀。", time: 3 },
  { title: "炒鸡蛋", detailedInstructions: "锅中加入食用油，油热后倒入鸡蛋，快速翻炒至刚刚凝固，然后盛出备用。", time: 3 },
  { title: "炒番茄", detailedInstructions: "锅中加入少量食用油，倒入番茄，中火翻炒至变软出汁，再加入少量盐和白糖。", time: 5 },
  { title: "混合调味", detailedInstructions: "将炒好的鸡蛋倒回锅中，与番茄翻炒均匀，让汤汁均匀裹住鸡蛋后即可出锅。", time: 2 },
];

const legacyIngredients = [
  { name: "番茄", quantity: 2, unit: "个" },
  { name: "鸡蛋", quantity: 3, unit: "个" },
];

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
      steps={legacySteps}
      ingredients={legacyIngredients}
      consumeOpen={consumeOpen}
      onStartConsume={() => setConsumeOpen(true)}
      onCloseConsume={() => setConsumeOpen(false)}
      onEndCooking={() => setDialog("确定结束这次制作吗？")}
      onConsumeDone={(consumed) => {
        const tomato = consumed.find((item) => item.name === "番茄")?.quantity ?? 0;
        const egg = consumed.find((item) => item.name === "鸡蛋")?.quantity ?? 0;
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
