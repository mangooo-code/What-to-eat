import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HomePage } from "./HomePage";
import { useApp } from "../context/AppContext";
import { inventoryService } from "../services/inventoryService";
import { createAppState } from "../tests/mockApp";

vi.mock("../context/AppContext", () => ({ useApp: vi.fn() }));
vi.mock("../services/inventoryService", () => ({ inventoryService: { exists: vi.fn() } }));
const mockedUseApp = vi.mocked(useApp);
const mockedExists = vi.mocked(inventoryService.exists);

function mockApp(overrides: Parameters<typeof createAppState>[0] = {}) {
  mockedUseApp.mockReturnValue(createAppState(overrides));
}

describe("HomePage", () => {
  beforeEach(() => {
    mockApp();
    mockedExists.mockReset();
    mockedExists.mockResolvedValue({ hasItems: true });
  });

  it("renders the greeting", () => {
    render(<HomePage />);
    expect(screen.getByText("今天想吃点什么？")).toBeInTheDocument();
  });

  it("navigates to the fridge", () => {
    const go = vi.fn();
    mockApp({ go });
    render(<HomePage />);
    fireEvent.click(screen.getByText("打开冰箱"));
    expect(go).toHaveBeenCalledWith("fridge");
  });

  it("navigates to findrecipes when the backend reports items in the fridge", async () => {
    mockedExists.mockResolvedValue({ hasItems: true });
    const go = vi.fn();
    mockApp({ go });
    render(<HomePage />);
    await act(async () => {});
    fireEvent.click(screen.getByText("帮我决定"));
    expect(go).toHaveBeenCalledWith("findrecipes");
  });

  it("shows a dialog instead when the backend reports an empty fridge", async () => {
    mockedExists.mockResolvedValue({ hasItems: false });
    const setDialog = vi.fn();
    mockApp({ setDialog });
    render(<HomePage />);
    await act(async () => {});
    fireEvent.click(screen.getByText("帮我决定"));
    expect(setDialog).toHaveBeenCalledWith("冰箱还是空空的，先放点食材进来吧。");
  });

  it("still navigates to findrecipes if the existence check fails", async () => {
    mockedExists.mockRejectedValue(new Error("network error"));
    const go = vi.fn();
    mockApp({ go });
    render(<HomePage />);
    await act(async () => {});
    fireEvent.click(screen.getByText("帮我决定"));
    expect(go).toHaveBeenCalledWith("findrecipes");
  });

  it("opens saved recipes", () => {
    const openRecipes = vi.fn();
    mockApp({ openRecipes });
    render(<HomePage />);
    fireEvent.click(screen.getByText("我的菜谱"));
    expect(openRecipes).toHaveBeenCalledWith("done");
  });
});
