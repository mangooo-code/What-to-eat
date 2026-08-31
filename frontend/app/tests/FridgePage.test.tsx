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

  it("switches storage place", () => {
    const setFridgePlace = vi.fn();
    mockApp({ foods, setFridgePlace });
    render(<FridgePage />);
    fireEvent.click(screen.getByText("冷冻"));
    expect(setFridgePlace).toHaveBeenCalledWith("冷冻");
  });

  it("shows an empty state when there is nothing in the current place", async () => {
    vi.spyOn(inventoryService, "list").mockResolvedValueOnce({ ...snapshot, items: [] });
    mockApp({ foods: [], fridgePlace: "冷藏" });
    render(<FridgePage />);
    expect(await screen.findByText("冰箱里还没记下什么食材。")).toBeInTheDocument();
  });

  it("opens the add-method modal and keeps the active storage place", async () => {
    const go = vi.fn();
    const setNewFood = vi.fn();
    const setFoodModal = vi.fn();
    mockApp({ foods, go, fridgePlace: "冷冻", setNewFood, setFoodModal });
    render(<FridgePage />);
    await screen.findByText("猪里脊");
    fireEvent.click(screen.getByText("＋ 添加食材"));
    expect(screen.getByRole("dialog", { name: "添加食材方式" })).toBeInTheDocument();
    expect(screen.getByText("添加食材到“冷冻”")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "手动添加" }).querySelector("img")).toHaveAttribute("src", "/assets/edit.png");
    expect(screen.getByRole("button", { name: "帮我识别" }).querySelector("img")).toHaveAttribute("src", "/assets/quick-solution.png");
    fireEvent.click(screen.getByText("手动添加"));
    expect(setNewFood).toHaveBeenCalledWith(expect.objectContaining({ place: "冷冻" }));
    expect(setFoodModal).toHaveBeenCalledWith("add");
    expect(go).not.toHaveBeenCalled();
  });

  it("opens recognition from the add-method modal", async () => {
    const go = vi.fn();
    mockApp({ foods, go });
    render(<FridgePage />);
    await screen.findByText("番茄");
    fireEvent.click(screen.getByText("＋ 添加食材"));
    fireEvent.click(screen.getByText("帮我识别"));
    expect(go).toHaveBeenCalledWith("capture");
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
    expect(setDialog).toHaveBeenCalledWith("要移除这项食材吗？");
  });

  it("shows the edit form and returns to the summary on cancel", async () => {
    const setFoodModal = vi.fn();
    mockApp({ foods, foodModal: "edit", editIndex: 0, setFoodModal });
    render(<FridgePage />);
    expect(await screen.findByText("编辑食材信息")).toBeInTheDocument();
    expect(screen.queryByLabelText("存放位置")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("取消"));
    expect(setFoodModal).toHaveBeenCalledWith("summary");
  });

  it("keeps the single-page controls visible and disabled", () => {
    mockApp({ foods });
    render(<FridgePage />);
    expect(screen.getByText("1 / 1")).toBeInTheDocument();
    expect(screen.getByLabelText("上一页")).toBeDisabled();
    expect(screen.getByLabelText("下一页")).toBeDisabled();
  });

  it("shows at most ten ingredients per page", async () => {
    const pagedFoods = Array.from({ length: 11 }, (_, index) => ({
      id: `10000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      name: `冷藏食材${index + 1}`,
      qty: 1,
      unit: "个",
      place: "冷藏",
      days: 3,
    }));
    vi.spyOn(inventoryService, "list").mockResolvedValueOnce({
      ...snapshot,
      items: pagedFoods.map((food) => ({
        id: food.id,
        ownerUserId: "20000000-0000-4000-8000-000000000001",
        name: food.name,
        normalizedName: food.name,
        quantity: 1,
        unitTypeId: 1,
        locationId: "30000000-0000-4000-8000-000000000001",
        expiryDate: new Date(Date.now() + 3 * 86_400_000).toISOString(),
        imageFileId: null,
        source: "manual",
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString(),
      })),
    });
    mockApp({ foods: pagedFoods });
    render(<FridgePage />);

    expect(await screen.findByText("冷藏食材1")).toBeInTheDocument();
    expect(screen.queryByText("冷藏食材11")).not.toBeInTheDocument();
    expect(screen.getByText("1 / 2")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("下一页"));
    expect(await screen.findByText("冷藏食材11")).toBeInTheDocument();
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
    expect(screen.getByLabelText("下一页")).toBeDisabled();
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
