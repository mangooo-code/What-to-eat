"use client";
import { Placeholder } from "./Placeholder";

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
      className={`choice ${selected ? "selected" : ""}`}
      onClick={onClick}
    >
      <Placeholder kind="icon" />
      <span>
        <strong>{label}</strong>
        {help && <small>{help}</small>}
      </span>
    </button>
  );
}
