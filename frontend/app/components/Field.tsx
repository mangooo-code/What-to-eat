"use client";
import { useState } from "react";
import "../styles/components/field.css";
import { units } from "../lib/data";
import type { Food } from "../lib/types";

export function Field({
  food,
  onChange,
  showPlace = true,
  showExpiry = true,
  useOptionalExpiry = false,
}: {
  food: Food;
  onChange: (f: Food) => void;
  showPlace?: boolean;
  showExpiry?: boolean;
  useOptionalExpiry?: boolean;
}) {
  const initialExpiryOption = food.days === null
    ? "none"
    : [3, 7, 14].includes(food.days)
      ? String(food.days)
      : "custom";
  const [expiryOption, setExpiryOption] = useState(initialExpiryOption);

  return (
    <div className="food-form">
      <label>
        食材名称
        <input
          value={food.name}
          onChange={(e) => onChange({ ...food, name: e.target.value })}
        />
      </label>
      <label>
        数量
        <input
          type="number"
          min="0"
          step="1"
          inputMode="numeric"
          value={food.qty}
          onChange={(e) =>
            onChange({
              ...food,
              qty: Math.max(0, Math.floor(Number(e.target.value) || 0)),
            })
          }
        />
      </label>
      <label>
        单位
        <select
          value={food.unit}
          onChange={(e) => onChange({ ...food, unit: e.target.value })}
        >
          {units.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </label>
      {showPlace && (
        <label>
          存放位置
          <select
            value={food.place}
            onChange={(e) => onChange({ ...food, place: e.target.value })}
          >
            {["冷藏", "冷冻", "常温"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
      )}
      {showExpiry && (useOptionalExpiry ? (
        <label className="optional-expiry-field">
          过期时间（选填）
          <select
            value={expiryOption}
            onChange={(e) => {
              const option = e.target.value;
              setExpiryOption(option);
              onChange({
                ...food,
                days: option === "none" ? null : option === "custom" ? Math.max(1, food.days ?? 1) : Number(option),
              });
            }}
          >
            <option value="none">暂不设置</option>
            <option value="3">3天后</option>
            <option value="7">7天后</option>
            <option value="14">14天后</option>
            <option value="custom">自定义</option>
          </select>
          {expiryOption === "custom" && (
            <span className="suffix custom-expiry-input">
              <input
                aria-label="自定义过期天数"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={Math.max(1, food.days ?? 1)}
                onChange={(e) =>
                  onChange({
                    ...food,
                    days: Math.max(1, Math.floor(Number(e.target.value) || 1)),
                  })
                }
              />
              <b>天后过期</b>
            </span>
          )}
        </label>
      ) : (
        <label>
          几天后过期
          <span className="suffix">
            <input
              type="number"
              step="1"
              inputMode="numeric"
              value={food.days ?? ""}
              onChange={(e) =>
                onChange({
                  ...food,
                  days: Math.floor(Number(e.target.value) || 0),
                })
              }
            />
            <b>天</b>
          </span>
        </label>
      ))}
    </div>
  );
}
