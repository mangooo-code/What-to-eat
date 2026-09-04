import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FoodEmoji } from "./FoodEmoji";

describe("FoodEmoji", () => {
  it.each([
    ["西红柿", "🍅"], ["马铃薯", "🥔"], ["菠菜", "🥬"], ["鸡胸肉", "🍗"],
    ["五花肉", "🥩"], ["螃蟹", "🦀"], ["豆腐", "◻️"], ["饺子", "🥟"],
  ])("uses the specific mapping for %s", (name, emoji) => {
    render(<FoodEmoji name={name} />);
    expect(screen.getByRole("img", { name })).toHaveTextContent(emoji);
  });

  it.each([
    ["有机小白菜", "🥬"], ["新鲜山药段", "🥔"], ["混合菌菇", "🍄"],
    ["进口水果拼盘", "🍎"], ["去骨鸭腿肉", "🍗"], ["深海鱼片", "🐟"],
    ["冷冻海鲜组合", "🦐"], ["鹌鹑蛋", "🥚"], ["低脂酸奶", "🥛"],
    ["猪肉馅", "🥩"], ["杂粮米饭", "🍚"], ["手工面食", "🍜"],
  ])("uses a category fallback for %s", (name, emoji) => {
    render(<FoodEmoji name={name} />);
    expect(screen.getByRole("img", { name })).toHaveTextContent(emoji);
  });

  it("keeps the existing generic fallback for an unknown ingredient", () => {
    render(<FoodEmoji name="神秘食材" />);
    expect(screen.getByRole("img", { name: "神秘食材" })).toHaveTextContent("🍽️");
  });
});
