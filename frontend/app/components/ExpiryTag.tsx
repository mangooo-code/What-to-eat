"use client";
import "../styles/components/expiry-tag.css";

export function ExpiryTag({ days, expiryDate }: { days: number | null; expiryDate?: string | null }) {
  const state =
    expiryDate === null || days === null
      ? ["未知", "expired"]
      : days < 0
      ? ["已过期", "expired"]
      : days === 0
        ? ["今日到期", "urgent"]
        : days <= 3
          ? ["即将过期", "urgent"]
          : ["正常", "normal"];
  return <span className={`expiry ${state[1]}`}>{state[0]}</span>;
}
