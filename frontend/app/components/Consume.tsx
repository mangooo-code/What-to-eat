"use client";
import "../styles/components/consume.css";
import { useState } from "react";
import { Header } from "./Header";
import { FoodEmoji } from "./FoodEmoji";

export function Consume({ onDone }: { onDone: (t: number, e: number) => void }) {
  const [t, setT] = useState(2),
    [e, setE] = useState(3);
  return (
    <>
      <Header
        title="刚刚用了哪些食材？"
        sub="我已经按菜谱填好预计用量，请确认实际使用数量。"
      />
      <div className="consume-grid">
        {[
          ["番茄", t, setT, "个"],
          ["鸡蛋", e, setE, "个"],
        ].map((x: any) => (
          <label className="consume" key={x[0]}>
            <FoodEmoji name={x[0]} />
            <span>
              <strong>{x[0]}</strong>
              <small>
                预计消耗 {x[0] === "番茄" ? 2 : 3} {x[3]}
              </small>
            </span>
            <span>
              <input
                type="number"
                min="0"
                max={x[0] === "番茄" ? 2 : 6}
                value={x[1]}
                onChange={(z) => x[2](Math.max(0, +z.target.value))}
              />
              {x[3]}
            </span>
          </label>
        ))}
      </div>
      <p className="notice">确认后会直接更新冰箱库存，不会产生负库存。</p>
      <button
        className="primary"
        onClick={() => onDone(Math.min(t, 2), Math.min(e, 6))}
      >
        确认食材消耗
      </button>
    </>
  );
}
