"use client";
import "../styles/components/profile-form.css";
import { useState } from "react";
import { Placeholder } from "./Placeholder";

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
        <Placeholder kind="icon" />
        {title}
        <small className="selection-rule">多选</small>
      </h2>
      <div className="chips">
        {items.map((x) => (
          <button
            className={selected.includes(x) ? "active" : ""}
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
        />
        <button onClick={add}>添加</button>
      </div>
    </section>
  );
}
