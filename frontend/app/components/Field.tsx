"use client";
import "../styles/components/field.css";
import { units } from "../lib/data";
import type { Food } from "../lib/types";

export function Field({
  food,
  onChange,
  showPlace = true,
}: {
  food: Food;
  onChange: (f: Food) => void;
  showPlace?: boolean;
}) {
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
      <label>
        几天后过期
        <span className="suffix">
          <input
            type="number"
            step="1"
            inputMode="numeric"
            value={food.days}
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
    </div>
  );
}
