import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EditPage } from "../pages/EditPage";
import { useApp } from "../context/AppContext";
import { createAppState } from "./mockApp";

vi.mock("../context/AppContext", () => ({ useApp: vi.fn() }));
const mockedUseApp = vi.mocked(useApp);

function mockApp(overrides: Parameters<typeof createAppState>[0] = {}) {
  mockedUseApp.mockReturnValue(createAppState(overrides));
}

const foods = [{ name: "番茄", qty: 2, unit: "个", place: "冷藏", days: 3 }];

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

  it("saves and navigates back to the fridge", () => {
    const say = vi.fn();
    const go = vi.fn();
    mockApp({ foods, editIndex: 0, say, go });
    render(<EditPage />);
    fireEvent.click(screen.getByText("保存修改"));
    expect(say).toHaveBeenCalledWith("已保存修改");
    expect(go).toHaveBeenCalledWith("fridge");
  });

  it("asks for confirmation before deleting", () => {
    const setDialog = vi.fn();
    mockApp({ foods, editIndex: 0, setDialog });
    render(<EditPage />);
    fireEvent.click(screen.getByText("删除食材"));
    expect(setDialog).toHaveBeenCalledWith("删除这项食材？");
  });
});
