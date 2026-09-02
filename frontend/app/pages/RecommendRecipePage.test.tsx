import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RecommendRecipePage } from "./RecommendRecipePage";
import { useApp } from "../context/AppContext";
import { createAppState } from "../tests/mockApp";

vi.mock("../context/AppContext", () => ({ useApp: vi.fn() }));
vi.mock("next/navigation", () => ({ useSearchParams: vi.fn() }));
const mockedUseApp = vi.mocked(useApp);

async function mockSearchParams(query: string) {
  const { useSearchParams } = await import("next/navigation");
  vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams(query) as never);
}

function mockApp(overrides: Parameters<typeof createAppState>[0] = {}) {
  mockedUseApp.mockReturnValue(createAppState(overrides));
}

describe("RecommendRecipePage", () => {
  beforeEach(() => {
    mockApp();
  });

  it("shows a not-found message when no recipe matches the id", async () => {
    await mockSearchParams("id=missing");
    const goBack = vi.fn();
    mockApp({ goBack });
    render(<RecommendRecipePage />);
    expect(screen.getByText(/没有找到这道菜谱/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /返回/ }));
    expect(goBack).toHaveBeenCalledTimes(1);
  });

  it("renders the matching recipe's detail", async () => {
    await mockSearchParams("id=9e2b8f2a-2f8a-4b2b-9b8f-2a2f8a4b2b9b");
    render(<RecommendRecipePage />);
    expect(screen.getByText("番茄炒蛋")).toBeInTheDocument();
  });

  it("toggles liked state for the matching recipe", async () => {
    await mockSearchParams("id=9e2b8f2a-2f8a-4b2b-9b8f-2a2f8a4b2b9b");
    const setLikedRecipes = vi.fn();
    mockApp({ setLikedRecipes });
    render(<RecommendRecipePage />);
    fireEvent.click(screen.getByText("♡ 喜欢"));
    expect(setLikedRecipes).toHaveBeenCalledTimes(1);
  });
});
