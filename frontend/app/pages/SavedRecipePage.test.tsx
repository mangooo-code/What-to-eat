import { fireEvent, render, screen, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SavedRecipePage } from "./SavedRecipePage";
import { recipeService } from "../services/recipeService";

const mockPush = vi.fn();
const mockBack = vi.fn();
vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(),
  useRouter: () => ({ push: mockPush, back: mockBack }),
}));
vi.mock("../services/recipeService", () => ({
  recipeService: { getById: vi.fn(), updateFavorite: vi.fn().mockResolvedValue({ updated: false, recipe: null }) },
}));
const mockedGetById = vi.mocked(recipeService.getById);
const mockedUpdateFavorite = vi.mocked(recipeService.updateFavorite);

async function mockSearchParams(query: string) {
  const { useSearchParams } = await import("next/navigation");
  vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams(query) as never);
}

const recipe = {
  id: "9e2b8f2a-2f8a-4b2b-9b8f-2a2f8a4b2b9b",
  name: "番茄炒蛋",
  description: "家常菜",
  difficulty: "简单",
  tags: ["家常"],
  isFavorite: false,
  cookTime: "15 分钟",
  ingredients: [{ name: "番茄", quantity: 2, unit: "个" }],
  seasonings: [{ name: "盐", quantity: "适量" }],
  steps: [{ title: "备料", detailedInstructions: "洗净切块", time: 5 }],
};

describe("SavedRecipePage", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockBack.mockClear();
    mockedGetById.mockReset();
    mockedUpdateFavorite.mockReset().mockResolvedValue({ updated: false, recipe: null });
  });

  it("shows a not-found message when the backend lookup fails", async () => {
    await mockSearchParams(`id=${recipe.id}`);
    mockedGetById.mockRejectedValue(new Error("not found"));
    render(<SavedRecipePage />);
    await act(async () => {});
    expect(screen.getByText(/没有找到这道菜谱/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /返回/ }));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("renders the matching recipe's detail, converting numeric ingredient quantities to display strings", async () => {
    await mockSearchParams(`id=${recipe.id}`);
    mockedGetById.mockResolvedValue(recipe);
    render(<SavedRecipePage />);
    await act(async () => {});
    expect(mockedGetById).toHaveBeenCalledWith(recipe.id);
    expect(screen.getByText("番茄炒蛋")).toBeInTheDocument();
    expect(screen.getByText("2 个")).toBeInTheDocument();
  });

  it("shows the heart as already liked when the recipe's isFavorite is true", async () => {
    await mockSearchParams(`id=${recipe.id}`);
    mockedGetById.mockResolvedValue({ ...recipe, isFavorite: true });
    render(<SavedRecipePage />);
    await act(async () => {});
    expect(screen.getByText("♥ 已喜欢")).toBeInTheDocument();
  });

  it("toggles liked state and calls updateFavorite", async () => {
    await mockSearchParams(`id=${recipe.id}`);
    mockedGetById.mockResolvedValue(recipe);
    render(<SavedRecipePage />);
    await act(async () => {});
    fireEvent.click(screen.getByText("♡ 喜欢"));
    expect(screen.getByText("♥ 已喜欢")).toBeInTheDocument();
    expect(mockedUpdateFavorite).toHaveBeenCalledWith(recipe.id, true);
  });

  it("navigates to cook mode with isStored=true", async () => {
    await mockSearchParams(`id=${recipe.id}`);
    mockedGetById.mockResolvedValue(recipe);
    render(<SavedRecipePage />);
    await act(async () => {});
    fireEvent.click(screen.getByText("再做一次"));
    expect(mockPush).toHaveBeenCalledWith(`/recipes/cookMode?id=${recipe.id}&isStored=true`);
  });

  it("uses router.back for the header back button", async () => {
    await mockSearchParams(`id=${recipe.id}`);
    mockedGetById.mockResolvedValue(recipe);
    render(<SavedRecipePage />);
    await act(async () => {});
    fireEvent.click(screen.getByRole("button", { name: /返回/ }));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
