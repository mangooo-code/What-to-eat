"use client";
import "../styles/components/profile-form.css";
import { Placeholder } from "./Placeholder";

export function Single({
  title,
  opts,
  selected,
  onSelect,
}: {
  title: string;
  opts: string[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <section className="block">
      <h2>
        <Placeholder kind="icon" />
        {title}
        <small className="selection-rule">单选</small>
      </h2>
      <div className="chips">
        {opts.map((x) => (
          <button
            className={selected === x ? "active" : ""}
            key={x}
            onClick={() => onSelect(x)}
          >
            {x}
          </button>
        ))}
      </div>
    </section>
  );
}
