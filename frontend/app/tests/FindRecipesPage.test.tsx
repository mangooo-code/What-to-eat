import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FindRecipesPage } from "../pages/FindRecipesPage";
import { useApp } from "../context/AppContext";
import { createAppState } from "./mockApp";

vi.mock("../context/AppContext", () => ({ useApp: vi.fn() }));
const mockedUseApp = vi.mocked(useApp);

function mockApp(overrides: Parameters<typeof createAppState>[0] = {}) {
  mockedUseApp.mockReturnValue(createAppState(overrides));
}

describe("FindRecipesPage", () => {
  beforeEach(() => {
    mockApp();
  });

  it("selects a time option", () => {
    const setTime = vi.fn();
    mockApp({ setTime });
    render(<FindRecipesPage />);
    fireEvent.click(screen.getByText("快速解决（15–30 分钟）"));
    expect(setTime).toHaveBeenCalledWith("快速解决（15–30 分钟）");
  });

  it("toggles a dining member", () => {
    const setMembers = vi.fn();
    mockApp({ members: ["11111111-1111-4111-8111-111111111111"], setMembers });
    render(<FindRecipesPage />);
    fireEvent.click(screen.getByText("阳"));
    expect(setMembers).toHaveBeenCalledTimes(1);
  });

  it("opens the add-member flow", () => {
    const openMember = vi.fn();
    mockApp({ openMember });
    render(<FindRecipesPage />);
    fireEvent.click(screen.getByText("＋ 添加成员"));
    expect(openMember).toHaveBeenCalledWith("findrecipes");
  });

  it("selects a taste preference", () => {
    const setTaste = vi.fn();
    mockApp({ setTaste });
    render(<FindRecipesPage />);
    fireEvent.click(screen.getByText("重口过瘾"));
    expect(setTaste).toHaveBeenCalledWith("重口过瘾");
  });

  it("toggles the prefer-liked-recipes switch", () => {
    const setPrefer = vi.fn();
    mockApp({ setPrefer });
    render(<FindRecipesPage />);
    fireEvent.click(screen.getByRole("checkbox"));
    expect(setPrefer).toHaveBeenCalledWith(true);
  });

  it("toggles a dietary limit", () => {
    const setChosenLimits = vi.fn();
    mockApp({ setChosenLimits });
    render(<FindRecipesPage />);
    fireEvent.click(screen.getByText("不吃辣"));
    expect(setChosenLimits).toHaveBeenCalledTimes(1);
  });

  it("reveals the custom-limit input", () => {
    const setOther = vi.fn();
    mockApp({ setOther });
    render(<FindRecipesPage />);
    fireEvent.click(screen.getByText("＋ 添加其他限制"));
    expect(setOther).toHaveBeenCalledWith(true);
  });

  it("adds a custom limit and resets the input", () => {
    const setChosenLimits = vi.fn();
    const setOtherLimit = vi.fn();
    const setOther = vi.fn();
    mockApp({
      other: true,
      otherLimit: "不吃动物内脏",
      setChosenLimits,
      setOtherLimit,
      setOther,
    });
    render(<FindRecipesPage />);
    fireEvent.click(screen.getByText("确认添加"));
    expect(setChosenLimits).toHaveBeenCalledTimes(1);
    expect(setOtherLimit).toHaveBeenCalledWith("");
    expect(setOther).toHaveBeenCalledWith(false);
  });

  it("blocks submission and shows an error when time is missing", () => {
    const setNeedError = vi.fn();
    const go = vi.fn();
    mockApp({ time: "", setNeedError, go });
    render(<FindRecipesPage />);
    expect(screen.getByRole("button", { name: "帮我挑一挑" })).toBeDisabled();
  });

  it("proceeds to recommend-loading once time is chosen", () => {
    const go = vi.fn();
    mockApp({ time: "快速解决（15–30 分钟）", go });
    render(<FindRecipesPage />);
    fireEvent.click(screen.getByRole("button", { name: "帮我挑一挑" }));
    expect(go).toHaveBeenCalledWith("recommend-loading");
  });
});
