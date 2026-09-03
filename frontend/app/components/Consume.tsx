"use client";
import "../styles/components/consume.css";
import { useState } from "react";
import { FoodEmoji } from "./FoodEmoji";

export interface ConsumeIngredient {
  name: string;
  quantity: number;
  unit: string;
}

export function Consume({
  ingredients,
  onDone,
  onClose,
}: {
  ingredients: ConsumeIngredient[];
  onDone: (consumed: Array<{ name: string; quantity: number }>) => void | Promise<void>;
  onClose?: () => void;
}) {
  const [amounts, setAmounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(ingredients.map((item) => [item.name, item.quantity])),
  );
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onDone(ingredients.map((item) => ({ name: item.name, quantity: amounts[item.name] ?? 0 })));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="consume-head">
        <h1 id="consume-title">刚刚用了哪些食材？</h1>
        {onClose && (
          <button className="modal-close" aria-label="关闭" onClick={onClose}>
            ×
          </button>
        )}
      </div>
      <p className="consume-sub">我已经按菜谱填好预计用量，请确认实际使用数量。</p>
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
                  type="text"
                  inputMode="decimal"
                  value={amounts[item.name] ?? 0}
                  disabled={submitting}
                  onChange={(e) => {
                    const digitsOnly = e.target.value.replace(/[^0-9.]/g, "");
                    const parsed = Number(digitsOnly);
                    setAmounts((a) => ({ ...a, [item.name]: Math.max(0, Number.isFinite(parsed) ? parsed : 0) }));
                  }}
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
      <button className="primary" onClick={handleConfirm} disabled={submitting}>
        {submitting ? <span className="button-spinner" role="status" aria-label="正在保存" /> : "确认食材消耗"}
      </button>
    </>
  );
}
