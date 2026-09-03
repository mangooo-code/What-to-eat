import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { RecipesPage } from "./RecipesPage";
import { useApp } from "../context/AppContext";
import { recipeService } from "../services/recipeService";
import { createAppState } from "../tests/mockApp";

vi.mock("../context/AppContext", () => ({ useApp: vi.fn() }));
vi.mock("../services/recipeService", () => ({ recipeService: { list: vi.fn() } }));
const mockedUseApp = vi.mocked(useApp);
const mockedList = vi.mocked(recipeService.list);

function mockApp(overrides: Parameters<typeof createAppState>[0] = {}) {
  mockedUseApp.mockReturnValue(createAppState(overrides));
}

describe("RecipesPage", () => {
  beforeEach(() => {
    mockedList.mockReset().mockResolvedValue([]);
  });

  it("shows history recipes by default", async () => {
    mockedList.mockResolvedValue([
      { id: "r1", name: "番茄炒蛋", cookTime: "15 分钟", difficulty: "简单", isFavorite: false, updatedDate: "d", matchSummary: "主要食材全部已有", hasEnoughIngredients: true },
    ]);
    mockApp({ page: "recipesHistory" });
    render(<RecipesPage />);
    await act(async () => {});
    expect(screen.getByText("15 分钟 · 简单")).toBeInTheDocument();
    expect(screen.getByText("主要食材全部已有")).toBeInTheDocument();
  });

  it("navigates to the favorites route when switching tabs", () => {
    const go = vi.fn();
    mockApp({ page: "recipesHistory", go });
    render(<RecipesPage />);
    fireEvent.click(screen.getByText("喜欢的菜谱"));
    expect(go).toHaveBeenCalledWith("recipesFavorites");
  });

  it("shows a liked badge on the liked tab", () => {
    mockApp({ page: "recipesFavorites" });
    render(<RecipesPage />);
    expect(screen.getAllByText("♥ 已喜欢").length).toBeGreaterThan(0);
  });

  it("opens a recipe and records where it came from", async () => {
    mockedList.mockResolvedValue([
      { id: "r1", name: "番茄炒蛋", cookTime: "15 分钟", difficulty: "简单", isFavorite: false, updatedDate: "d", matchSummary: "主要食材全部已有", hasEnoughIngredients: true },
    ]);
    const setRecipeOrigin = vi.fn();
    const go = vi.fn();
    mockApp({ page: "recipesHistory", setRecipeOrigin, go });
    render(<RecipesPage />);
    await act(async () => {});
    fireEvent.click(screen.getByText("番茄炒蛋"));
    expect(setRecipeOrigin).toHaveBeenCalledWith("done");
    expect(go).toHaveBeenCalledWith("recipe");
  });

  it("goes back to home when that's where it was opened from", () => {
    const goBack = vi.fn();
    mockApp({ page: "recipesHistory", recipesListOrigin: "home", goBack });
    render(<RecipesPage />);
    fireEvent.click(screen.getByRole("button", { name: /返回/ }));
    expect(goBack).toHaveBeenCalledWith("home");
  });

  it("goes back to profile when that's where it was opened from", () => {
    const goBack = vi.fn();
    mockApp({ page: "recipesFavorites", recipesListOrigin: "profile", goBack });
    render(<RecipesPage />);
    fireEvent.click(screen.getByRole("button", { name: /返回/ }));
    expect(goBack).toHaveBeenCalledWith("profile");
  });

  it("shows a spinner (no empty-state flash) while history is still loading", () => {
    mockApp({ page: "recipesHistory" });
    render(<RecipesPage />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("还没有做过的菜谱")).not.toBeInTheDocument();
  });

  it("shows the empty state once history has loaded with no recipes", async () => {
    mockApp({ page: "recipesHistory" });
    render(<RecipesPage />);
    await act(async () => {});
    expect(screen.getByText("还没有做过的菜谱")).toBeInTheDocument();
  });
});
