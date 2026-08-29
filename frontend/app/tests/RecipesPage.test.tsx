import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RecipesPage } from "../pages/RecipesPage";
import { useApp } from "../context/AppContext";
import { createAppState } from "./mockApp";

vi.mock("../context/AppContext", () => ({ useApp: vi.fn() }));
const mockedUseApp = vi.mocked(useApp);

function mockApp(overrides: Parameters<typeof createAppState>[0] = {}) {
  mockedUseApp.mockReturnValue(createAppState(overrides));
}

describe("RecipesPage", () => {
  it("shows history recipes by default", () => {
    mockApp({ recipeTab: "done" });
    render(<RecipesPage />);
    expect(screen.getByText("上周 · 3 次")).toBeInTheDocument();
  });

  it("switches to liked recipes", () => {
    const setRecipeTab = vi.fn();
    mockApp({ recipeTab: "done", setRecipeTab });
    render(<RecipesPage />);
    fireEvent.click(screen.getByText("喜欢的菜谱"));
    expect(setRecipeTab).toHaveBeenCalledWith("liked");
  });

  it("shows a liked badge on the liked tab", () => {
    mockApp({ recipeTab: "liked" });
    render(<RecipesPage />);
    expect(screen.getAllByText("♥ 已喜欢").length).toBeGreaterThan(0);
  });

  it("opens a recipe and records where it came from", () => {
    const setRecipeOrigin = vi.fn();
    const go = vi.fn();
    mockApp({ recipeTab: "done", setRecipeOrigin, go });
    render(<RecipesPage />);
    fireEvent.click(screen.getByText("番茄炒蛋"));
    expect(setRecipeOrigin).toHaveBeenCalledWith("done");
    expect(go).toHaveBeenCalledWith("recipe");
  });
});
