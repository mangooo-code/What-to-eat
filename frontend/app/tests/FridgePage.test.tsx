import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FridgePage } from "../pages/FridgePage";
import { useApp } from "../context/AppContext";
import { createAppState } from "./mockApp";
import { inventoryService } from "../services/inventoryService";

vi.mock("../context/AppContext", () => ({ useApp: vi.fn() }));
const mockedUseApp = vi.mocked(useApp);

function mockApp(overrides: Parameters<typeof createAppState>[0] = {}) {
  mockedUseApp.mockReturnValue(createAppState(overrides));
}

const foods = [
  { id: "10000000-0000-4000-8000-000000000001", name: "番茄", qty: 2, unit: "个", place: "冷藏", days: 3 },
  { id: "10000000-0000-4000-8000-000000000002", name: "猪里脊", qty: 300, unit: "g", place: "冷冻", days: 15 },
];
const snapshot = {
  items: foods.map((food, index) => ({
    id: food.id,
    ownerUserId: "20000000-0000-4000-8000-000000000001",
    name: food.name,
    normalizedName: food.name,
    quantity: Number(food.qty),
    unitTypeId: index + 1,
    locationId: index ? "30000000-0000-4000-8000-000000000002" : "30000000-0000-4000-8000-000000000001",
    expiryDate: new Date(Date.now() + food.days * 86_400_000).toISOString(),
    imageFileId: null,
    source: "manual" as const,
    createdDate: new Date().toISOString(),
    updatedDate: new Date().toISOString(),
  })),
  locations: [
    { id: "30000000-0000-4000-8000-000000000001", key: "fridge" as const, name: "冷藏" },
    { id: "30000000-0000-4000-8000-000000000002", key: "freezer" as const, name: "冷冻" },
    { id: "30000000-0000-4000-8000-000000000003", key: "pantry" as const, name: "常温" },
  ],
  unitTypes: [{ id: 1, name: "个" }, { id: 2, name: "g" }],
};

describe("FridgePage", () => {
  beforeEach(() => {
    mockApp({ foods });
    vi.spyOn(inventoryService, "list").mockResolvedValue(snapshot);
  });

  it("shows only the foods in the active storage place", async () => {
    render(<FridgePage />);
    expect(await screen.findByText("番茄")).toBeInTheDocument();
    expect(screen.queryByText("猪里脊")).not.toBeInTheDocument();
  });

  it("switches storage place and resets the page", () => {
    const setFridgePlace = vi.fn();
    const setFridgePage = vi.fn();
    mockApp({ foods, setFridgePlace, setFridgePage });
    render(<FridgePage />);
    fireEvent.click(screen.getByText("冷冻"));
    expect(setFridgePlace).toHaveBeenCalledWith("冷冻");
    expect(setFridgePage).toHaveBeenCalledWith(0);
  });

  it("shows an empty state when there is nothing in the current place", async () => {
    vi.spyOn(inventoryService, "list").mockResolvedValueOnce({ ...snapshot, items: [] });
    mockApp({ foods: [], fridgePlace: "冷藏" });
    render(<FridgePage />);
    expect(await screen.findByText("这里还没有食材")).toBeInTheDocument();
  });

  it("opens the existing add-food form", async () => {
    const setFoodModal = vi.fn();
    mockApp({ foods, setFoodModal });
    render(<FridgePage />);
    await screen.findByText("番茄");
    fireEvent.click(screen.getByText("＋ 添加食材"));
    expect(setFoodModal).toHaveBeenCalledWith("add");
  });

  it("opens the summary modal for a tapped food", async () => {
    const setEditIndex = vi.fn();
    const setFoodModal = vi.fn();
    mockApp({ foods, setEditIndex, setFoodModal });
    render(<FridgePage />);
    fireEvent.click(await screen.findByText("番茄"));
    expect(setEditIndex).toHaveBeenCalledWith(0);
    expect(setFoodModal).toHaveBeenCalledWith("summary");
  });

  it("shows the summary modal and removes the food", async () => {
    const setFoodModal = vi.fn();
    const setDialog = vi.fn();
    mockApp({ foods, foodModal: "summary", editIndex: 0, setFoodModal, setDialog });
    render(<FridgePage />);
    expect(await screen.findByText("存放于：冷藏")).toBeInTheDocument();
    fireEvent.click(screen.getByText("移除食材"));
    expect(setFoodModal).toHaveBeenCalledWith(null);
    expect(setDialog).toHaveBeenCalledWith("删除这项食材？");
  });

  it("shows the edit form and returns to the summary on cancel", async () => {
    const setFoodModal = vi.fn();
    mockApp({ foods, foodModal: "edit", editIndex: 0, setFoodModal });
    render(<FridgePage />);
    expect(await screen.findByText("编辑食材信息")).toBeInTheDocument();
    fireEvent.click(screen.getByText("取消"));
    expect(setFoodModal).toHaveBeenCalledWith("summary");
  });

  it("disables the previous-page button on the first page", () => {
    mockApp({ foods, fridgePage: 0 });
    render(<FridgePage />);
    expect(screen.getByLabelText("上一页")).toBeDisabled();
  });

  it("keeps existing data when inventory loading fails", async () => {
    const setFoods = vi.fn();
    vi.spyOn(inventoryService, "list").mockRejectedValueOnce(new Error("offline"));
    mockApp({ foods, setFoods });
    render(<FridgePage />);
    expect(await screen.findByText("库存加载失败，请稍后重试")).toBeInTheDocument();
    await waitFor(() => expect(setFoods).not.toHaveBeenCalled());
  });
});
