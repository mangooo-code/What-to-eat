"use client";
import { AssetImage } from "./AssetImage";

export function Choice({
  label,
  selected,
  onClick,
  help,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  help?: string;
}) {
  return (
    <button
      type="button"
      className={`choice ${selected ? "selected" : ""}`}
      aria-pressed={selected}
      onClick={onClick}
    >
      <AssetImage
        name={label.startsWith("快速") ? "quick-solution.png" : "cook-at-your-own-pace.png"}
        alt=""
      />
      <span>
        <strong>{label}</strong>
        {help && <small>{help}</small>}
      </span>
    </button>
  );
}
