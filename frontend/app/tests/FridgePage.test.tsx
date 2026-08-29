import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FridgePage } from "../pages/FridgePage";
import { useApp } from "../context/AppContext";
import { createAppState } from "./mockApp";

vi.mock("../context/AppContext", () => ({ useApp: vi.fn() }));
const mockedUseApp = vi.mocked(useApp);

function mockApp(overrides: Parameters<typeof createAppState>[0] = {}) {
  mockedUseApp.mockReturnValue(createAppState(overrides));
}

const foods = [
  { name: "番茄", qty: 2, unit: "个", place: "冷藏", days: 3 },
  { name: "猪里脊", qty: 300, unit: "g", place: "冷冻", days: 15 },
];

describe("FridgePage", () => {
  beforeEach(() => {
    mockApp({ foods });
  });

  it("shows only the foods in the active storage place", () => {
    render(<FridgePage />);
    expect(screen.getByText("番茄")).toBeInTheDocument();
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

  it("shows an empty state when there is nothing in the current place", () => {
    mockApp({ foods: [], fridgePlace: "冷藏" });
    render(<FridgePage />);
    expect(screen.getByText("这里还没有食材")).toBeInTheDocument();
  });

  it("navigates to capture from the add-food buttons", () => {
    const go = vi.fn();
    mockApp({ foods, go });
    render(<FridgePage />);
    fireEvent.click(screen.getByText("＋ 添加食材"));
    expect(go).toHaveBeenCalledWith("capture");
  });

  it("opens the summary modal for a tapped food", () => {
    const setEditIndex = vi.fn();
    const setFoodModal = vi.fn();
    mockApp({ foods, setEditIndex, setFoodModal });
    render(<FridgePage />);
    fireEvent.click(screen.getByText("番茄"));
    expect(setEditIndex).toHaveBeenCalledWith(0);
    expect(setFoodModal).toHaveBeenCalledWith("summary");
  });

  it("shows the summary modal and removes the food", () => {
    const setFoodModal = vi.fn();
    const setDialog = vi.fn();
    mockApp({ foods, foodModal: "summary", editIndex: 0, setFoodModal, setDialog });
    render(<FridgePage />);
    expect(screen.getByText("存放于：冷藏")).toBeInTheDocument();
    fireEvent.click(screen.getByText("移除食材"));
    expect(setFoodModal).toHaveBeenCalledWith(null);
    expect(setDialog).toHaveBeenCalledWith("删除这项食材？");
  });

  it("shows the edit form and returns to the summary on cancel", () => {
    const setFoodModal = vi.fn();
    mockApp({ foods, foodModal: "edit", editIndex: 0, setFoodModal });
    render(<FridgePage />);
    expect(screen.getByText("编辑食材信息")).toBeInTheDocument();
    fireEvent.click(screen.getByText("取消"));
    expect(setFoodModal).toHaveBeenCalledWith("summary");
  });

  it("disables the previous-page button on the first page", () => {
    mockApp({ foods, fridgePage: 0 });
    render(<FridgePage />);
    expect(screen.getByLabelText("上一页")).toBeDisabled();
  });
});
