"use client";
import "../styles/components/profile-form.css";
import { useState } from "react";
import { AssetImage } from "./AssetImage";

export function EditableMulti({
  title,
  opts,
  selected,
  onSelect,
  allergy = false,
}: {
  title: string;
  opts: string[];
  selected: string[];
  onSelect: (v: string[]) => void;
  allergy?: boolean;
}) {
  const [custom, setCustom] = useState("");
  const items = [...opts, ...selected.filter((x) => !opts.includes(x))];
  const add = () => {
    const v = custom.trim();
    if (v) onSelect(selected.includes(v) ? selected : [...selected, v]);
    setCustom("");
  };
  return (
    <section className="block">
      <h2>
        <AssetImage name={allergy ? "allergens.png" : "foods-to-avoid.png"} alt="" />
        {title}
        <small className="selection-rule">多选</small>
      </h2>
      <div className="chips">
        {items.map((x) => (
          <button
            type="button"
            className={selected.includes(x) ? "active" : ""}
            aria-pressed={selected.includes(x)}
            key={x}
            onClick={() =>
              onSelect(
                allergy && x === "无已知过敏原"
                  ? [x]
                  : selected.includes(x)
                    ? selected.filter((v) => v !== x)
                    : [...selected.filter((v) => v !== "无已知过敏原"), x],
              )
            }
          >
            {x}
          </button>
        ))}
      </div>
      <div className="manual-add">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder={`手动添加${title}`}
          aria-label={`手动添加${title}`}
        />
        <button type="button" onClick={add}>添加</button>
      </div>
    </section>
  );
}
