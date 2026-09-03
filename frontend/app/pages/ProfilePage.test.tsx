import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProfilePage } from "./ProfilePage";
import { useApp } from "../context/AppContext";
import { recipeService } from "../services/recipeService";
import { createAppState } from "../tests/mockApp";

vi.mock("../context/AppContext", () => ({ useApp: vi.fn() }));
vi.mock("../services/recipeService", () => ({ recipeService: { counts: vi.fn() } }));
const mockedUseApp = vi.mocked(useApp);
const mockedCounts = vi.mocked(recipeService.counts);

function mockApp(overrides: Parameters<typeof createAppState>[0] = {}) {
  mockedUseApp.mockReturnValue(createAppState(overrides));
}

describe("ProfilePage", () => {
  beforeEach(() => {
    mockApp();
    mockedCounts.mockReset().mockResolvedValue({ totalCount: 8, favoriteCount: 5 });
  });

  it("lists every household member's profile summary", () => {
    render(<ProfilePage />);
    expect(screen.getByText("我")).toBeInTheDocument();
    expect(screen.getByText("阳")).toBeInTheDocument();
    expect(screen.getByText("妈妈")).toBeInTheDocument();
  });

  it("shows real cooked and liked recipe counts from the backend", async () => {
    render(<ProfilePage />);
    await act(async () => {});
    expect(screen.getByText("8 条做饭记录")).toBeInTheDocument();
    expect(screen.getByText("5 道心水菜")).toBeInTheDocument();
  });

  it("opens saved-recipe shortcuts", () => {
    const openRecipes = vi.fn();
    mockApp({ openRecipes });
    render(<ProfilePage />);
    fireEvent.click(screen.getByText("历史菜谱"));
    expect(openRecipes).toHaveBeenCalledWith("done");
  });

  it("opens the add-member flow", () => {
    const openMember = vi.fn();
    mockApp({ openMember });
    render(<ProfilePage />);
    fireEvent.click(screen.getByText("＋ 添加成员"));
    expect(openMember).toHaveBeenCalledWith("profile");
  });

  it("opens a member's diet page", () => {
    const openDiet = vi.fn();
    mockApp({ openDiet });
    render(<ProfilePage />);
    fireEvent.click(screen.getByText("阳"));
    expect(openDiet).toHaveBeenCalledWith("22222222-2222-4222-8222-222222222222");
  });

  it("asks for confirmation before logging out", () => {
    const setDialog = vi.fn();
    mockApp({ setDialog });
    render(<ProfilePage />);
    fireEvent.click(screen.getByText("退出登录"));
    expect(setDialog).toHaveBeenCalledWith("确定要退出登录吗？");
  });
});
