import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RecipePage } from "../pages/RecipePage";
import { useApp } from "../context/AppContext";
import { createAppState } from "./mockApp";

vi.mock("../context/AppContext", () => ({ useApp: vi.fn() }));
const mockedUseApp = vi.mocked(useApp);

function mockApp(overrides: Parameters<typeof createAppState>[0] = {}) {
  mockedUseApp.mockReturnValue(createAppState(overrides));
}

describe("RecipePage", () => {
  beforeEach(() => {
    mockApp();
  });

  it("renders the recipe details", () => {
    render(<RecipePage />);
    expect(screen.getByText("番茄炒蛋")).toBeInTheDocument();
  });

  it("toggles liked", () => {
    const setLiked = vi.fn();
    mockApp({ liked: false, setLiked });
    render(<RecipePage />);
    fireEvent.click(screen.getByText("♡ 喜欢"));
    expect(setLiked).toHaveBeenCalledWith(true);
  });

  it("uses recipeBack for the header back button", () => {
    const recipeBack = vi.fn();
    mockApp({ recipeBack });
    render(<RecipePage />);
    fireEvent.click(screen.getByRole("button", { name: /返回/ }));
    expect(recipeBack).toHaveBeenCalledTimes(1);
  });

  it("shows '就做这道' when coming from the recommendations", () => {
    const go = vi.fn();
    mockApp({ recipeOrigin: "recommend", go });
    render(<RecipePage />);
    fireEvent.click(screen.getByText("就做这道"));
    expect(go).toHaveBeenCalledWith("cook");
  });

  it("shows '再做一次' when coming from saved recipes", () => {
    mockApp({ recipeOrigin: "done" });
    render(<RecipePage />);
    expect(screen.getByText("再做一次")).toBeInTheDocument();
  });
});
