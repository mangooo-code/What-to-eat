"use client";
import "../styles/components/expiry-tag.css";

export function ExpiryTag({ days }: { days: number }) {
  const state =
    days < 0
      ? ["已过期", "expired"]
      : days === 0
        ? ["今日到期", "urgent"]
        : days <= 3
          ? ["即将过期", "urgent"]
          : ["正常", "normal"];
  return <span className={`expiry ${state[1]}`}>{state[0]}</span>;
}
