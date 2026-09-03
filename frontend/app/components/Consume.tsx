"use client";
import "../styles/components/consume.css";
import { useState } from "react";
import { Header } from "./Header";
import { FoodEmoji } from "./FoodEmoji";

export interface ConsumeIngredient {
  name: string;
  quantity: number;
  unit: string;
}

export function Consume({
  ingredients,
  onDone,
}: {
  ingredients: ConsumeIngredient[];
  onDone: (consumed: Array<{ name: string; quantity: number }>) => void;
}) {
  const [amounts, setAmounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(ingredients.map((item) => [item.name, item.quantity])),
  );
  return (
    <>
      <Header
        title="刚刚用了哪些食材？"
        sub="我已经按菜谱填好预计用量，请确认实际使用数量。"
      />
      {ingredients.length ? (
        <div className="consume-grid">
          {ingredients.map((item) => (
            <label className="consume" key={item.name}>
              <FoodEmoji name={item.name} />
              <span>
                <strong>{item.name}</strong>
                <small>
                  预计消耗 {item.quantity} {item.unit}
                </small>
              </span>
              <span>
                <input
                  type="number"
                  min="0"
                  value={amounts[item.name] ?? 0}
                  onChange={(e) =>
                    setAmounts((a) => ({ ...a, [item.name]: Math.max(0, Number(e.target.value)) }))
                  }
                />
                {item.unit}
              </span>
            </label>
          ))}
        </div>
      ) : (
        <p className="notice">暂无食材信息，可直接确认完成。</p>
      )}
      <p className="notice">确认后会直接更新冰箱库存，不会产生负库存。</p>
      <button
        className="primary"
        onClick={() =>
          onDone(ingredients.map((item) => ({ name: item.name, quantity: amounts[item.name] ?? 0 })))
        }
      >
        确认食材消耗
      </button>
    </>
  );
}
