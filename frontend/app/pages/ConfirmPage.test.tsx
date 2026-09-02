import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConfirmPage } from "./ConfirmPage";
import { useApp } from "../context/AppContext";
import { createAppState } from "../tests/mockApp";
import { inventoryService } from "../services/inventoryService";

vi.mock("../context/AppContext", () => ({ useApp: vi.fn() }));
const mockedUseApp = vi.mocked(useApp);

function mockApp(overrides: Parameters<typeof createAppState>[0] = {}) {
  mockedUseApp.mockReturnValue(createAppState(overrides));
}

const foods = [{ name: "番茄", qty: 2, unit: "个", place: "冷藏", days: 3 }];
const foodsWithoutExpiry = [{ name: "番茄", qty: 2, unit: "个", place: "冷藏", days: null }];

describe("ConfirmPage", () => {
  beforeEach(() => {
    mockApp({ foods });
    vi.spyOn(inventoryService, "list").mockResolvedValue({
      items: [],
      locations: [{ id: "location-fridge", key: "fridge", name: "冷藏" }],
      unitTypes: [{ id: 1, name: "个" }],
    });
    vi.spyOn(inventoryService, "create").mockResolvedValue({} as never);
  });

  it("lists the detected foods", () => {
    render(<ConfirmPage />);
    expect(screen.getByText("番茄")).toBeInTheDocument();
  });

  it("opens the editor for a food when 修改 is clicked", () => {
    const setConfirmEdit = vi.fn();
    mockApp({ foods, setConfirmEdit });
    render(<ConfirmPage />);
    fireEvent.click(screen.getByText("修改"));
    expect(setConfirmEdit).toHaveBeenCalledWith(0);
  });

  it("adds an optional expiry inside the ingredient card", () => {
    const setFoods = vi.fn();
    mockApp({ foods: foodsWithoutExpiry, setFoods });
    render(<ConfirmPage />);

    fireEvent.click(screen.getByText("+ 添加过期时间"));
    fireEvent.click(screen.getByText("7天后"));

    const update = setFoods.mock.calls[0][0] as (items: typeof foodsWithoutExpiry) => typeof foodsWithoutExpiry;
    expect(update(foodsWithoutExpiry)[0].days).toBe(7);
  });

  it("starts a new food entry from the add-row button", () => {
    const setNewFood = vi.fn();
    const setConfirmEdit = vi.fn();
    mockApp({ foods, setNewFood, setConfirmEdit });
    render(<ConfirmPage />);
    fireEvent.click(screen.getByText("＋ 添加食材"));
    expect(setNewFood).toHaveBeenCalled();
    expect(setConfirmEdit).toHaveBeenCalledWith(-1);
  });

  it("writes the confirmed foods to the active area and returns", async () => {
    const say = vi.fn();
    const go = vi.fn();
    mockApp({ foods, say, go });
    render(<ConfirmPage />);
    fireEvent.click(screen.getByText("确认添加"));
    await waitFor(() => expect(inventoryService.create).toHaveBeenCalledWith(expect.objectContaining({
      name: "番茄",
      locationId: "location-fridge",
      source: "recognition",
    })));
    expect(say).toHaveBeenCalledWith("食材已经添加到冷藏");
    expect(go).toHaveBeenCalledWith("fridge");
  });

  it("submits null when an expiry was not set", async () => {
    mockApp({ foods: foodsWithoutExpiry });
    render(<ConfirmPage />);
    fireEvent.click(screen.getByText("确认添加"));

    await waitFor(() => expect(inventoryService.create).toHaveBeenCalledWith(
      expect.objectContaining({ expiryDate: null }),
    ));
  });

  it("shows the editor modal with a delete option for existing foods", () => {
    const setFoods = vi.fn();
    const setConfirmEdit = vi.fn();
    mockApp({ foods, confirmEdit: 0, setFoods, setConfirmEdit });
    render(<ConfirmPage />);
    expect(screen.getByText("编辑食材信息")).toBeInTheDocument();
    expect(screen.queryByText("几天后过期")).not.toBeInTheDocument();
    expect(screen.queryByText("过期时间（选填）")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("删除"));
    expect(setFoods).toHaveBeenCalledTimes(1);
    expect(setConfirmEdit).toHaveBeenCalledWith(null);
  });

  it("shows the add-food modal without a delete option", () => {
    mockApp({
      foods,
      confirmEdit: -1,
      newFood: { name: "青椒", qty: 1, unit: "个", place: "冷藏", days: null },
    });
    render(<ConfirmPage />);
    expect(screen.getByText("新增食材信息")).toBeInTheDocument();
    expect(screen.queryByText("删除")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("存放位置")).not.toBeInTheDocument();
    expect(screen.getByLabelText("过期时间（选填）")).toHaveValue("none");
  });
});
