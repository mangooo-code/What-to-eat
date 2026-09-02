import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RecipeDetail, type RecipeDetailData } from "./RecipeDetail";

const baseRecipe: RecipeDetailData = {
  name: "番茄炒蛋",
  cookTime: "15 分钟",
  difficulty: "简单",
  tags: ["家常"],
};

describe("RecipeDetail", () => {
  it("renders the name, cookTime, difficulty, and tags", () => {
    render(
      <RecipeDetail
        recipe={baseRecipe}
        liked={false}
        onToggleLike={vi.fn()}
        primaryLabel="就做这道"
        onPrimary={vi.fn()}
      />,
    );
    expect(screen.getByText("番茄炒蛋")).toBeInTheDocument();
    expect(screen.getByText("15 分钟｜简单 · 家常")).toBeInTheDocument();
  });

  it("shows placeholder text when no ingredients/seasonings are provided", () => {
    render(
      <RecipeDetail
        recipe={baseRecipe}
        liked={false}
        onToggleLike={vi.fn()}
        primaryLabel="就做这道"
        onPrimary={vi.fn()}
      />,
    );
    expect(screen.getByText("暂无食材信息")).toBeInTheDocument();
    expect(screen.getByText("暂无调料信息")).toBeInTheDocument();
  });

  it("renders real ingredients, seasonings, and steps when provided", () => {
    render(
      <RecipeDetail
        recipe={{
          ...baseRecipe,
          ingredients: [{ name: "番茄", quantity: "2 个" }],
          seasonings: [{ name: "盐", quantity: "适量" }],
          steps: [{ title: "备料", detailedInstructions: "洗净切块", time: 5 }],
        }}
        liked={false}
        onToggleLike={vi.fn()}
        primaryLabel="就做这道"
        onPrimary={vi.fn()}
      />,
    );
    expect(screen.getByText("2 个")).toBeInTheDocument();
    expect(screen.getByText("适量")).toBeInTheDocument();
    expect(screen.getByText("备料")).toBeInTheDocument();
    expect(screen.getByText("洗净切块")).toBeInTheDocument();
    expect(screen.getByText("5 分钟")).toBeInTheDocument();
  });

  it("toggles liked state via the heart button", () => {
    const onToggleLike = vi.fn();
    render(
      <RecipeDetail
        recipe={baseRecipe}
        liked={false}
        onToggleLike={onToggleLike}
        primaryLabel="就做这道"
        onPrimary={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("♡ 喜欢"));
    expect(onToggleLike).toHaveBeenCalledTimes(1);
  });

  it("fires onPrimary with the given label", () => {
    const onPrimary = vi.fn();
    render(
      <RecipeDetail
        recipe={baseRecipe}
        liked={false}
        onToggleLike={vi.fn()}
        primaryLabel="再做一次"
        onPrimary={onPrimary}
      />,
    );
    fireEvent.click(screen.getByText("再做一次"));
    expect(onPrimary).toHaveBeenCalledTimes(1);
  });
});
