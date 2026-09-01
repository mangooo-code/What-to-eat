import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RecommendPage } from "../pages/RecommendPage";
import { useApp } from "../context/AppContext";
import { createAppState } from "./mockApp";

vi.mock("../context/AppContext", () => ({ useApp: vi.fn() }));
const mockedUseApp = vi.mocked(useApp);

function mockApp(overrides: Parameters<typeof createAppState>[0] = {}) {
  mockedUseApp.mockReturnValue(createAppState(overrides));
}

describe("RecommendPage", () => {
  beforeEach(() => {
    mockApp();
  });

  it("shows recipes from the backend result", () => {
    render(<RecommendPage />);
    expect(screen.getByText("番茄炒蛋")).toBeInTheDocument();
  });

  it("renders whatever recommendedRecipes context provides", () => {
    mockApp({
      recommendedRecipes: [
        {
          id: "c1a1a1a1-1a1a-4a1a-8a1a-a1a1a1a1a1a1",
          name: "可乐鸡翅",
          cookTime: "30 分钟",
          difficulty: "简单",
          matchSummary: "缺少 2 种主要食材",
          description: "换一批后的固定推荐结果。",
          tags: [],
        },
      ],
    });
    render(<RecommendPage />);
    expect(screen.getByText("可乐鸡翅")).toBeInTheDocument();
    expect(screen.queryByText("番茄炒蛋")).not.toBeInTheDocument();
  });

  it("toggles a liked recipe", () => {
    const setLikedRecipes = vi.fn();
    mockApp({ setLikedRecipes });
    render(<RecommendPage />);
    fireEvent.click(screen.getAllByText("♡ 喜欢")[0]);
    expect(setLikedRecipes).toHaveBeenCalledTimes(1);
  });

  it("opens a recipe and records its origin", () => {
    const setRecipeOrigin = vi.fn();
    const go = vi.fn();
    mockApp({ setRecipeOrigin, go });
    render(<RecommendPage />);
    fireEvent.click(screen.getAllByText("查看菜谱")[0]);
    expect(setRecipeOrigin).toHaveBeenCalledWith("recommend");
    expect(go).toHaveBeenCalledWith("recipe");
  });

  it("requests a new batch after a short delay", () => {
    vi.useFakeTimers();
    const say = vi.fn();
    const setBatch = vi.fn();
    mockApp({ say, setBatch });
    render(<RecommendPage />);
    fireEvent.click(screen.getByText("换一批"));
    expect(say).toHaveBeenCalledWith("没事，我再帮你挑几道。");
    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(setBatch).toHaveBeenCalledWith(1);
    vi.useRealTimers();
  });

  it("returns to the findrecipes page to adjust requirements", () => {
    const go = vi.fn();
    mockApp({ go });
    render(<RecommendPage />);
    fireEvent.click(screen.getByText("调整需求"));
    expect(go).toHaveBeenCalledWith("findrecipes");
  });
});
