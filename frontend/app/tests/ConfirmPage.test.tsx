import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConfirmPage } from "../pages/ConfirmPage";
import { useApp } from "../context/AppContext";
import { createAppState } from "./mockApp";

vi.mock("../context/AppContext", () => ({ useApp: vi.fn() }));
const mockedUseApp = vi.mocked(useApp);

function mockApp(overrides: Parameters<typeof createAppState>[0] = {}) {
  mockedUseApp.mockReturnValue(createAppState(overrides));
}

const foods = [{ name: "番茄", qty: 2, unit: "个", place: "冷藏", days: 3 }];

describe("ConfirmPage", () => {
  beforeEach(() => {
    mockApp({ foods });
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

  it("starts a new food entry from the add-row button", () => {
    const setNewFood = vi.fn();
    const setConfirmEdit = vi.fn();
    mockApp({ foods, setNewFood, setConfirmEdit });
    render(<ConfirmPage />);
    fireEvent.click(screen.getByText("＋ 添加食材"));
    expect(setNewFood).toHaveBeenCalled();
    expect(setConfirmEdit).toHaveBeenCalledWith(-1);
  });

  it("confirms and returns to the fridge", () => {
    const say = vi.fn();
    const go = vi.fn();
    mockApp({ foods, say, go });
    render(<ConfirmPage />);
    fireEvent.click(screen.getByText("确认添加"));
    expect(say).toHaveBeenCalledWith("食材已经添加到冰箱");
    expect(go).toHaveBeenCalledWith("fridge");
  });

  it("shows the editor modal with a delete option for existing foods", () => {
    const setFoods = vi.fn();
    const setConfirmEdit = vi.fn();
    mockApp({ foods, confirmEdit: 0, setFoods, setConfirmEdit });
    render(<ConfirmPage />);
    expect(screen.getByText("编辑食材信息")).toBeInTheDocument();
    fireEvent.click(screen.getByText("删除"));
    expect(setFoods).toHaveBeenCalledTimes(1);
    expect(setConfirmEdit).toHaveBeenCalledWith(null);
  });

  it("shows the add-food modal without a delete option", () => {
    mockApp({
      foods,
      confirmEdit: -1,
      newFood: { name: "青椒", qty: 1, unit: "个", place: "冷藏", days: 3 },
    });
    render(<ConfirmPage />);
    expect(screen.getByText("新增食材信息")).toBeInTheDocument();
    expect(screen.queryByText("删除")).not.toBeInTheDocument();
  });
});
