"use client";

const emojiByName: Record<string, string> = {
  番茄: "🍅",
  西红柿: "🍅",
  鸡蛋: "🥚",
  嫩豆腐: "🧈",
  豆腐: "🧈",
  青椒: "🫑",
  猪里脊: "🥩",
  牛奶: "🥛",
  盐: "🧂",
  食用油: "🫗",
  白糖: "🍬",
};

export function FoodEmoji({ name, className = "food-emoji" }: { name: string; className?: string }) {
  return <span className={className} role="img" aria-label={name}>{emojiByName[name] ?? "🍽️"}</span>;
}
