import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CookPage } from "../pages/CookPage";
import { useApp } from "../context/AppContext";
import { createAppState } from "./mockApp";

vi.mock("../context/AppContext", () => ({ useApp: vi.fn() }));
const mockedUseApp = vi.mocked(useApp);

function mockApp(overrides: Parameters<typeof createAppState>[0] = {}) {
  mockedUseApp.mockReturnValue(createAppState(overrides));
}

describe("CookPage", () => {
  beforeEach(() => {
    mockApp();
  });

  it("shows the link back to recommendations only when relevant", () => {
    const { rerender } = render(<CookPage />);
    mockApp({ recipeOrigin: "done" });
    rerender(<CookPage />);
    expect(screen.queryByText("‹ 看看其他菜谱")).not.toBeInTheDocument();

    mockApp({ recipeOrigin: "recommend" });
    rerender(<CookPage />);
    expect(screen.getByText("‹ 看看其他菜谱")).toBeInTheDocument();
  });

  it("opens the consume modal when done cooking", () => {
    const setConsumeOpen = vi.fn();
    mockApp({ setConsumeOpen });
    render(<CookPage />);
    fireEvent.click(screen.getByText("做好啦"));
    expect(setConsumeOpen).toHaveBeenCalledWith(true);
  });

  it("asks for confirmation before ending the cook", () => {
    const setDialog = vi.fn();
    mockApp({ setDialog });
    render(<CookPage />);
    fireEvent.click(screen.getByText("结束制作"));
    expect(setDialog).toHaveBeenCalledWith("确定结束这次制作吗？");
  });

  it("confirms consumption and moves to feedback", () => {
    const setFoods = vi.fn();
    const setConsumeOpen = vi.fn();
    const go = vi.fn();
    mockApp({ consumeOpen: true, setFoods, setConsumeOpen, go });
    render(<CookPage />);
    fireEvent.click(screen.getByText("确认食材消耗"));
    expect(setFoods).toHaveBeenCalledTimes(1);
    expect(setConsumeOpen).toHaveBeenCalledWith(false);
    expect(go).toHaveBeenCalledWith("feedback");
  });

  it("closes the consume modal", () => {
    const setConsumeOpen = vi.fn();
    mockApp({ consumeOpen: true, setConsumeOpen });
    render(<CookPage />);
    fireEvent.click(screen.getByText("×"));
    expect(setConsumeOpen).toHaveBeenCalledWith(false);
  });
});
