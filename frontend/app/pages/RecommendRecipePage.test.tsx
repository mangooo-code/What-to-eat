import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RecommendRecipePage } from "./RecommendRecipePage";
import { useApp } from "../context/AppContext";
import { currentlyCookingStorage } from "../services/currentlyCookingStorage";
import { recipeService } from "../services/recipeService";
import { createAppState } from "../tests/mockApp";

vi.mock("../context/AppContext", () => ({ useApp: vi.fn() }));
vi.mock("next/navigation", () => ({ useSearchParams: vi.fn() }));
vi.mock("../services/recipeService", () => ({
  recipeService: { save: vi.fn(), updateFavorite: vi.fn().mockResolvedValue({ updated: false, recipe: null }) },
}));
vi.mock("../services/currentlyCookingStorage", () => ({
  currentlyCookingStorage: { get: vi.fn(), set: vi.fn(), clear: vi.fn() },
}));
const mockedUseApp = vi.mocked(useApp);
const mockedSave = vi.mocked(recipeService.save);
const mockedUpdateFavorite = vi.mocked(recipeService.updateFavorite);
const mockedSet = vi.mocked(currentlyCookingStorage.set);

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
    mockedSave.mockReset();
    mockedUpdateFavorite.mockReset().mockResolvedValue({ updated: false, recipe: null });
    mockedSet.mockReset();
  });

  it("shows a not-found message when no recipe matches the id", async () => {
    await mockSearchParams("id=missing");
    const goBack = vi.fn();
    mockApp({ goBack });
    render(<RecommendRecipePage />);
    expect(screen.getByText(/没有找到这道菜谱/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /返回/ }));
    expect(goBack).toHaveBeenCalledWith();
  });

  it("renders the matching recipe's detail", async () => {
    await mockSearchParams("id=9e2b8f2a-2f8a-4b2b-9b8f-2a2f8a4b2b9b");
    render(<RecommendRecipePage />);
    expect(screen.getByText("番茄炒蛋")).toBeInTheDocument();
  });

  it("shows the heart as already liked when the recipe's isFavorite is true", async () => {
    await mockSearchParams("id=9e2b8f2a-2f8a-4b2b-9b8f-2a2f8a4b2b9b");
    mockApp({
      recommendedRecipes: [
        { id: "9e2b8f2a-2f8a-4b2b-9b8f-2a2f8a4b2b9b", name: "番茄炒蛋", cookTime: "15 分钟", difficulty: "简单", matchSummary: "", description: "", tags: [], isFavorite: true },
      ],
    });
    render(<RecommendRecipePage />);
    expect(screen.getByText("♥ 已喜欢")).toBeInTheDocument();
  });

  it("toggles liked state for the matching recipe", async () => {
    await mockSearchParams("id=9e2b8f2a-2f8a-4b2b-9b8f-2a2f8a4b2b9b");
    const setLikedRecipes = vi.fn();
    const setRecommendedRecipes = vi.fn();
    mockApp({ setLikedRecipes, setRecommendedRecipes });
    render(<RecommendRecipePage />);
    fireEvent.click(screen.getByText("♡ 喜欢"));
    expect(setLikedRecipes).toHaveBeenCalledTimes(1);
    expect(setRecommendedRecipes).toHaveBeenCalledTimes(1);
    const updated = setRecommendedRecipes.mock.calls[0][0];
    expect(updated.find((r: { id: string }) => r.id === "9e2b8f2a-2f8a-4b2b-9b8f-2a2f8a4b2b9b").isFavorite).toBe(true);
    expect(mockedUpdateFavorite).toHaveBeenCalledWith("9e2b8f2a-2f8a-4b2b-9b8f-2a2f8a4b2b9b", true);
  });

  it("saves the recipe and stores its id as currentlyCooking before going to cook", async () => {
    await mockSearchParams("id=9e2b8f2a-2f8a-4b2b-9b8f-2a2f8a4b2b9b");
    mockedSave.mockResolvedValue({ id: "9e2b8f2a-2f8a-4b2b-9b8f-2a2f8a4b2b9b" });
    const go = vi.fn();
    mockApp({ go });
    render(<RecommendRecipePage />);
    fireEvent.click(screen.getByText("就做这道"));
    await vi.waitFor(() => expect(mockedSet).toHaveBeenCalledWith("9e2b8f2a-2f8a-4b2b-9b8f-2a2f8a4b2b9b"));
    expect(go).toHaveBeenCalledWith("cook");
  });

  it("still goes to cook if saving the recipe fails", async () => {
    await mockSearchParams("id=9e2b8f2a-2f8a-4b2b-9b8f-2a2f8a4b2b9b");
    mockedSave.mockRejectedValue(new Error("network error"));
    const go = vi.fn();
    mockApp({ go });
    render(<RecommendRecipePage />);
    fireEvent.click(screen.getByText("就做这道"));
    await vi.waitFor(() => expect(go).toHaveBeenCalledWith("cook"));
    expect(mockedSet).not.toHaveBeenCalled();
  });
});
