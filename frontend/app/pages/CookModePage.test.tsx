import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CookModePage } from "./CookModePage";
import { useApp } from "../context/AppContext";
import { currentlyCookingStorage } from "../services/currentlyCookingStorage";
import { inventoryService } from "../services/inventoryService";
import { recipeService } from "../services/recipeService";
import { createAppState } from "../tests/mockApp";

vi.mock("../context/AppContext", () => ({ useApp: vi.fn() }));
const mockPush = vi.fn();
const mockBack = vi.fn();
vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(),
  useRouter: () => ({ push: mockPush, back: mockBack }),
}));
vi.mock("../services/recipeService", () => ({ recipeService: { getById: vi.fn(), save: vi.fn() } }));
vi.mock("../services/currentlyCookingStorage", () => ({
  currentlyCookingStorage: { get: vi.fn(), set: vi.fn(), clear: vi.fn() },
}));
vi.mock("../services/inventoryService", () => ({ inventoryService: { consume: vi.fn() } }));
const mockedUseApp = vi.mocked(useApp);
const mockedGetById = vi.mocked(recipeService.getById);
const mockedSave = vi.mocked(recipeService.save);
const mockedSet = vi.mocked(currentlyCookingStorage.set);
const mockedConsume = vi.mocked(inventoryService.consume);

async function mockSearchParams(query: string) {
  const { useSearchParams } = await import("next/navigation");
  vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams(query) as never);
}

function mockApp(overrides: Parameters<typeof createAppState>[0] = {}) {
  mockedUseApp.mockReturnValue(createAppState(overrides));
}

describe("CookModePage", () => {
  beforeEach(() => {
    mockApp();
    mockPush.mockClear();
    mockBack.mockClear();
    mockedGetById.mockReset();
    mockedSave.mockReset().mockResolvedValue({ id: "mock-id" });
    mockedSet.mockReset();
    mockedConsume.mockReset().mockResolvedValue({ consumed: true });
  });

  it("goes to home when no recipe matches the id in localStorage", async () => {
    await mockSearchParams("id=missing");
    const go = vi.fn();
    mockApp({ go });
    render(<CookModePage />);
    expect(go).toHaveBeenCalledWith("home");
  });

  it("renders the matching recipe's name and cook time from localStorage", async () => {
    await mockSearchParams("id=9e2b8f2a-2f8a-4b2b-9b8f-2a2f8a4b2b9b");
    render(<CookModePage />);
    expect(screen.getByText(/番茄炒蛋 · 预计 15 分钟/)).toBeInTheDocument();
    expect(mockedGetById).not.toHaveBeenCalled();
  });

  it("fetches the recipe from the backend when isStored=true", async () => {
    await mockSearchParams("id=8b412e45-1acd-412c-ae89-4028704fb9a1&isStored=true");
    mockedGetById.mockResolvedValue({
      id: "8b412e45-1acd-412c-ae89-4028704fb9a1",
      name: "黑椒牛柳",
      description: null,
      difficulty: "简单",
      tags: [],
      cookTime: "20 分钟",
      ingredients: [],
      seasonings: [],
      steps: [],
    });
    render(<CookModePage />);
    await act(async () => {});
    expect(mockedGetById).toHaveBeenCalledWith("8b412e45-1acd-412c-ae89-4028704fb9a1");
    expect(screen.getByText(/黑椒牛柳 · 预计 20 分钟/)).toBeInTheDocument();
  });

  it("loads the recipe's required ingredients from the backend when isStored=true", async () => {
    await mockSearchParams("id=8b412e45-1acd-412c-ae89-4028704fb9a1&isStored=true");
    mockedGetById.mockResolvedValue({
      id: "8b412e45-1acd-412c-ae89-4028704fb9a1",
      name: "黑椒牛柳",
      description: null,
      difficulty: "简单",
      tags: [],
      cookTime: "20 分钟",
      ingredients: [{ name: "牛柳", quantity: 300 }],
      seasonings: [],
      steps: [],
    });
    render(<CookModePage />);
    await act(async () => {});
    await expect(mockedGetById.mock.results[0].value).resolves.toMatchObject({
      ingredients: [{ name: "牛柳", quantity: 300 }],
    });
  });

  it("loads the recipe's required ingredients from localStorage when isStored is false", async () => {
    await mockSearchParams("id=9e2b8f2a-2f8a-4b2b-9b8f-2a2f8a4b2b9b");
    mockApp({
      recommendedRecipes: [
        {
          id: "9e2b8f2a-2f8a-4b2b-9b8f-2a2f8a4b2b9b",
          name: "番茄炒蛋",
          cookTime: "15 分钟",
          difficulty: "简单",
          matchSummary: "",
          description: "",
          tags: [],
          ingredients: [{ name: "番茄", quantity: "2 个" }],
        },
      ],
    });
    render(<CookModePage />);
    expect(mockedGetById).not.toHaveBeenCalled();
    expect(screen.getByText(/番茄炒蛋 · 预计 15 分钟/)).toBeInTheDocument();
  });

  it("goes to home when isStored=true and the backend lookup fails", async () => {
    await mockSearchParams("id=8b412e45-1acd-412c-ae89-4028704fb9a1&isStored=true");
    mockedGetById.mockRejectedValue(new Error("not found"));
    const go = vi.fn();
    mockApp({ go });
    render(<CookModePage />);
    await act(async () => {});
    expect(go).toHaveBeenCalledWith("home");
  });

  it("goes back in browser history", async () => {
    await mockSearchParams("id=9e2b8f2a-2f8a-4b2b-9b8f-2a2f8a4b2b9b");
    render(<CookModePage />);
    fireEvent.click(screen.getByRole("button", { name: /返回/ }));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("opens the consume modal when done cooking", async () => {
    await mockSearchParams("id=9e2b8f2a-2f8a-4b2b-9b8f-2a2f8a4b2b9b");
    const setConsumeOpen = vi.fn();
    mockApp({ setConsumeOpen });
    render(<CookModePage />);
    fireEvent.click(screen.getByText("做好啦"));
    expect(setConsumeOpen).toHaveBeenCalledWith(true);
    expect(mockedSave).not.toHaveBeenCalled();
  });

  it("saves the recipe and stores its id as currentlyCooking when isStored is false, when consumption is confirmed", async () => {
    await mockSearchParams("id=9e2b8f2a-2f8a-4b2b-9b8f-2a2f8a4b2b9b&isStored=false");
    mockedSave.mockResolvedValue({ id: "9e2b8f2a-2f8a-4b2b-9b8f-2a2f8a4b2b9b" });
    mockApp({ consumeOpen: true });
    render(<CookModePage />);
    await act(async () => {
      fireEvent.click(screen.getByText("确认食材消耗"));
    });
    expect(mockedSave).toHaveBeenCalledWith(
      expect.objectContaining({ id: "9e2b8f2a-2f8a-4b2b-9b8f-2a2f8a4b2b9b", name: "番茄炒蛋" }),
    );
    expect(mockedSet).toHaveBeenCalledWith("9e2b8f2a-2f8a-4b2b-9b8f-2a2f8a4b2b9b");
  });

  it("does not save again when isStored is true, when consumption is confirmed", async () => {
    await mockSearchParams("id=8b412e45-1acd-412c-ae89-4028704fb9a1&isStored=true");
    mockedGetById.mockResolvedValue({
      id: "8b412e45-1acd-412c-ae89-4028704fb9a1",
      name: "黑椒牛柳",
      description: null,
      difficulty: "简单",
      tags: [],
      cookTime: "20 分钟",
      ingredients: [],
      seasonings: [],
      steps: [],
    });
    mockApp({ consumeOpen: true });
    render(<CookModePage />);
    await act(async () => {});
    await act(async () => {
      fireEvent.click(screen.getByText("确认食材消耗"));
    });
    expect(mockedSave).not.toHaveBeenCalled();
    expect(mockedSet).not.toHaveBeenCalled();
  });

  it("asks for confirmation before ending the cook", async () => {
    await mockSearchParams("id=9e2b8f2a-2f8a-4b2b-9b8f-2a2f8a4b2b9b");
    const setDialog = vi.fn();
    mockApp({ setDialog });
    render(<CookModePage />);
    fireEvent.click(screen.getByText("结束制作"));
    expect(setDialog).toHaveBeenCalledWith("确定结束这次制作吗？");
  });

  it("confirms consumption and moves to feedback", async () => {
    await mockSearchParams("id=9e2b8f2a-2f8a-4b2b-9b8f-2a2f8a4b2b9b");
    const setConsumeOpen = vi.fn();
    const go = vi.fn();
    mockApp({ consumeOpen: true, setConsumeOpen, go });
    render(<CookModePage />);
    await act(async () => {
      fireEvent.click(screen.getByText("确认食材消耗"));
    });
    expect(setConsumeOpen).toHaveBeenCalledWith(false);
    expect(go).toHaveBeenCalledWith("feedback");
  });

  it("shows the recipe's real ingredients (split into quantity/unit) and deducts the entered amounts when isStored is false", async () => {
    await mockSearchParams("id=9e2b8f2a-2f8a-4b2b-9b8f-2a2f8a4b2b9b&isStored=false");
    mockApp({
      consumeOpen: true,
      recommendedRecipes: [
        {
          id: "9e2b8f2a-2f8a-4b2b-9b8f-2a2f8a4b2b9b",
          name: "番茄炒蛋",
          cookTime: "15 分钟",
          difficulty: "简单",
          matchSummary: "",
          description: "",
          tags: [],
          ingredients: [{ name: "番茄", quantity: "2 个" }],
        },
      ],
    });
    render(<CookModePage />);
    expect(screen.getByText(/预计消耗 2 个/)).toBeInTheDocument();
    const [input] = screen.getAllByRole("textbox");
    fireEvent.change(input, { target: { value: "1" } });
    await act(async () => {
      fireEvent.click(screen.getByText("确认食材消耗"));
    });
    expect(mockedConsume).toHaveBeenCalledWith([{ name: "番茄", quantity: 1 }]);
  });

  it("shows the recipe's real ingredients from the DB and deducts the entered amounts when isStored is true", async () => {
    await mockSearchParams("id=8b412e45-1acd-412c-ae89-4028704fb9a1&isStored=true");
    mockApp({ consumeOpen: true });
    mockedGetById.mockResolvedValue({
      id: "8b412e45-1acd-412c-ae89-4028704fb9a1",
      name: "黑椒牛柳",
      description: null,
      difficulty: "简单",
      tags: [],
      cookTime: "20 分钟",
      ingredients: [{ name: "牛柳", quantity: 300, unit: "克" }],
      seasonings: [],
      steps: [],
    });
    render(<CookModePage />);
    await act(async () => {});
    expect(screen.getByText(/预计消耗 300 克/)).toBeInTheDocument();
    const [input] = screen.getAllByRole("textbox");
    fireEvent.change(input, { target: { value: "250" } });
    await act(async () => {
      fireEvent.click(screen.getByText("确认食材消耗"));
    });
    expect(mockedConsume).toHaveBeenCalledWith([{ name: "牛柳", quantity: 250 }]);
  });

  it("closes the consume modal", async () => {
    await mockSearchParams("id=9e2b8f2a-2f8a-4b2b-9b8f-2a2f8a4b2b9b");
    const setConsumeOpen = vi.fn();
    mockApp({ consumeOpen: true, setConsumeOpen });
    render(<CookModePage />);
    fireEvent.click(screen.getByText("×"));
    expect(setConsumeOpen).toHaveBeenCalledWith(false);
  });
});
