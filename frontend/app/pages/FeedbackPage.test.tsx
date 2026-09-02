import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FeedbackPage } from "./FeedbackPage";
import { useApp } from "../context/AppContext";
import { createAppState } from "../tests/mockApp";

vi.mock("../context/AppContext", () => ({ useApp: vi.fn() }));
const mockedUseApp = vi.mocked(useApp);

function mockApp(overrides: Parameters<typeof createAppState>[0] = {}) {
  mockedUseApp.mockReturnValue(createAppState(overrides));
}

describe("FeedbackPage", () => {
  beforeEach(() => {
    mockApp();
  });

  it("records a meal reaction", () => {
    const setMealReaction = vi.fn();
    mockApp({ setMealReaction });
    render(<FeedbackPage />);
    fireEvent.click(screen.getByText("好吃！"));
    expect(setMealReaction).toHaveBeenCalledWith("好吃！");
  });

  it("toggles liked", () => {
    const setLiked = vi.fn();
    mockApp({ liked: false, setLiked });
    render(<FeedbackPage />);
    fireEvent.click(screen.getByText("♡ 加入喜欢"));
    expect(setLiked).toHaveBeenCalledWith(true);
  });

  it("shows the success state after finishing", () => {
    mockApp({ success: true });
    render(<FeedbackPage />);
    expect(screen.getByText("记住啦，下次继续帮你挑合适的。")).toBeInTheDocument();
  });

  it("navigates home after the success state expires", () => {
    vi.useFakeTimers();
    const setSuccess = vi.fn();
    const go = vi.fn();
    mockApp({ setSuccess, go });
    render(<FeedbackPage />);
    fireEvent.click(screen.getByText("完成"));
    expect(setSuccess).toHaveBeenCalledWith(true);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(setSuccess).toHaveBeenCalledWith(false);
    expect(go).toHaveBeenCalledWith("home");
    vi.useRealTimers();
  });
});
