import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProfilePage } from "../pages/ProfilePage";
import { useApp } from "../context/AppContext";
import { createAppState } from "./mockApp";

vi.mock("../context/AppContext", () => ({ useApp: vi.fn() }));
const mockedUseApp = vi.mocked(useApp);

function mockApp(overrides: Parameters<typeof createAppState>[0] = {}) {
  mockedUseApp.mockReturnValue(createAppState(overrides));
}

describe("ProfilePage", () => {
  beforeEach(() => {
    mockApp();
  });

  it("lists every household member's profile summary", () => {
    render(<ProfilePage />);
    expect(screen.getByText("我")).toBeInTheDocument();
    expect(screen.getByText("阳")).toBeInTheDocument();
    expect(screen.getByText("妈妈")).toBeInTheDocument();
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
