import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RecipesPage } from "./RecipesPage";
import { useApp } from "../context/AppContext";
import { createAppState } from "../tests/mockApp";

vi.mock("../context/AppContext", () => ({ useApp: vi.fn() }));
const mockedUseApp = vi.mocked(useApp);

function mockApp(overrides: Parameters<typeof createAppState>[0] = {}) {
  mockedUseApp.mockReturnValue(createAppState(overrides));
}

describe("RecipesPage", () => {
  it("shows history recipes by default", () => {
    mockApp({ page: "recipesHistory" });
    render(<RecipesPage />);
    expect(screen.getByText("上周 · 3 次")).toBeInTheDocument();
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

  it("opens a recipe and records where it came from", () => {
    const setRecipeOrigin = vi.fn();
    const go = vi.fn();
    mockApp({ page: "recipesHistory", setRecipeOrigin, go });
    render(<RecipesPage />);
    fireEvent.click(screen.getByText("番茄炒蛋"));
    expect(setRecipeOrigin).toHaveBeenCalledWith("done");
    expect(go).toHaveBeenCalledWith("recipe");
  });
});
