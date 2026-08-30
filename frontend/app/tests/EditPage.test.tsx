import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EditPage } from "../pages/EditPage";
import { useApp } from "../context/AppContext";
import { createAppState } from "./mockApp";
import { inventoryService } from "../services/inventoryService";

vi.mock("../context/AppContext", () => ({ useApp: vi.fn() }));
const mockedUseApp = vi.mocked(useApp);

function mockApp(overrides: Parameters<typeof createAppState>[0] = {}) {
  mockedUseApp.mockReturnValue(createAppState(overrides));
}

const food = { id: "10000000-0000-4000-8000-000000000001", name: "番茄", qty: 2, unit: "个", place: "冷藏", days: 3 };
const foods = [food];

describe("EditPage", () => {
  it("renders nothing when the food no longer exists", () => {
    mockApp({ foods: [], editIndex: 0 });
    const { container } = render(<EditPage />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the food form when it exists", () => {
    mockApp({ foods, editIndex: 0 });
    render(<EditPage />);
    expect(screen.getByLabelText("食材名称")).toHaveValue("番茄");
  });

  it("saves and navigates back to the fridge", async () => {
    const say = vi.fn();
    const go = vi.fn();
    mockApp({ foods, editIndex: 0, say, go });
    vi.spyOn(inventoryService, "list").mockResolvedValue({
      items: [],
      locations: [{ id: "30000000-0000-4000-8000-000000000001", key: "fridge", name: "冷藏" }],
      unitTypes: [{ id: 1, name: "个" }],
    });
    vi.spyOn(inventoryService, "update").mockResolvedValue({
      id: food.id,
      ownerUserId: "20000000-0000-4000-8000-000000000001",
      name: food.name,
      normalizedName: food.name,
      quantity: 2,
      unitTypeId: 1,
      locationId: "30000000-0000-4000-8000-000000000001",
      expiryDate: null,
      imageFileId: null,
      source: "manual",
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
    });
    render(<EditPage />);
    fireEvent.click(screen.getByText("保存修改"));
    await waitFor(() => expect(say).toHaveBeenCalledWith("已保存修改"));
    expect(go).toHaveBeenCalledWith("fridge");
  });

  it("asks for confirmation before deleting", () => {
    const setDialog = vi.fn();
    mockApp({ foods, editIndex: 0, setDialog });
    render(<EditPage />);
    fireEvent.click(screen.getByText("删除食材"));
    expect(setDialog).toHaveBeenCalledWith("要移除这项食材吗？");
  });
});
