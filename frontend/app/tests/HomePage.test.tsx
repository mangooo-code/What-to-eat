import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HomePage } from "../pages/HomePage";
import { useApp } from "../context/AppContext";
import { createAppState } from "./mockApp";

vi.mock("../context/AppContext", () => ({ useApp: vi.fn() }));
const mockedUseApp = vi.mocked(useApp);

function mockApp(overrides: Parameters<typeof createAppState>[0] = {}) {
  mockedUseApp.mockReturnValue(createAppState(overrides));
}

describe("HomePage", () => {
  beforeEach(() => {
    mockApp();
  });

  it("renders the greeting", () => {
    render(<HomePage />);
    expect(screen.getByText("今天吃什么？")).toBeInTheDocument();
  });

  it("navigates to the fridge", () => {
    const go = vi.fn();
    mockApp({ go });
    render(<HomePage />);
    fireEvent.click(screen.getByText("打开冰箱"));
    expect(go).toHaveBeenCalledWith("fridge");
  });

  it("navigates to needs when there are foods", () => {
    const go = vi.fn();
    mockApp({ go, foods: [{ name: "番茄", qty: 1, unit: "个", place: "冷藏", days: 3 }] });
    render(<HomePage />);
    fireEvent.click(screen.getByText("帮我决定"));
    expect(go).toHaveBeenCalledWith("needs");
  });

  it("shows a dialog instead when the fridge is empty", () => {
    const setDialog = vi.fn();
    mockApp({ foods: [], setDialog });
    render(<HomePage />);
    fireEvent.click(screen.getByText("帮我决定"));
    expect(setDialog).toHaveBeenCalledWith("冰箱里还没记东西呢");
  });

  it("opens saved recipes", () => {
    const openRecipes = vi.fn();
    mockApp({ openRecipes });
    render(<HomePage />);
    fireEvent.click(screen.getByText("我的菜谱"));
    expect(openRecipes).toHaveBeenCalledWith("done");
  });
});
