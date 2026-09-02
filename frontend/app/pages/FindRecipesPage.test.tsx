import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FindRecipesPage } from "./FindRecipesPage";
import { useApp } from "../context/AppContext";
import { findRecipesService } from "../services/findRecipesService";
import { inventoryService } from "../services/inventoryService";
import { memberService } from "../services/memberService";
import type { HouseholdMember } from "../types/domain";
import { createAppState } from "../tests/mockApp";

vi.mock("../context/AppContext", () => ({ useApp: vi.fn() }));
vi.mock("../services/findRecipesService", () => ({ findRecipesService: { submit: vi.fn() } }));
vi.mock("../services/inventoryService", () => ({ inventoryService: { exists: vi.fn() } }));
vi.mock("../services/memberService", () => ({ memberService: { list: vi.fn() } }));
const mockedUseApp = vi.mocked(useApp);
const mockedSubmit = vi.mocked(findRecipesService.submit);
const mockedExists = vi.mocked(inventoryService.exists);
const mockedList = vi.mocked(memberService.list);

const member: HouseholdMember = {
  memberId: "22222222-2222-4222-8222-222222222222",
  ownerUserId: "00000000-0000-4000-8000-000000000000",
  name: "阳",
  relationship: "伴侣",
  isOwner: false,
  tastePreference: null,
  dietPreference: null,
  dietaryRestrictions: [],
  allergens: [],
  createdDate: "2026-08-30T00:00:00.000Z",
  updatedDate: "2026-08-30T00:00:00.000Z",
};

function mockApp(overrides: Parameters<typeof createAppState>[0] = {}) {
  mockedUseApp.mockReturnValue(createAppState(overrides));
}

// Flushes the mount-time memberService.list() fetch so it settles inside act().
async function renderPage() {
  render(<FindRecipesPage />);
  await act(async () => {});
}

describe("FindRecipesPage", () => {
  beforeEach(() => {
    mockApp();
    mockedList.mockResolvedValue([]);
    mockedExists.mockResolvedValue({ hasItems: true });
  });

  it("selects a time option", async () => {
    const setTime = vi.fn();
    mockApp({ setTime });
    await renderPage();
    fireEvent.click(screen.getByText("快速解决（15–30 分钟）"));
    expect(setTime).toHaveBeenCalledWith("快速解决（15–30 分钟）");
  });

  it("opens the member picker dialog", async () => {
    await renderPage();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("添加就餐人"));
    expect(await screen.findByRole("dialog", { name: "挑选就餐人" })).toBeInTheDocument();
  });

  it("selects a member from the picker and can remove them", async () => {
    mockedList.mockResolvedValue([member]);
    const setMembers = vi.fn();
    mockApp({ setMembers });
    await renderPage();
    fireEvent.click(screen.getByLabelText("添加就餐人"));
    fireEvent.click(await screen.findByRole("button", { name: "阳" }));
    expect(setMembers).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByLabelText("移除阳"));
    expect(setMembers).toHaveBeenCalledTimes(2);
  });

  it("selects a taste preference", async () => {
    const setTaste = vi.fn();
    mockApp({ setTaste });
    await renderPage();
    fireEvent.click(screen.getByText("重口过瘾"));
    expect(setTaste).toHaveBeenCalledWith("重口过瘾");
  });

  it("toggles the prefer-liked-recipes switch", async () => {
    const setPrefer = vi.fn();
    mockApp({ setPrefer });
    await renderPage();
    fireEvent.click(screen.getByRole("checkbox"));
    expect(setPrefer).toHaveBeenCalledWith(true);
  });

  it("toggles a dietary limit", async () => {
    const setChosenLimits = vi.fn();
    mockApp({ setChosenLimits });
    await renderPage();
    fireEvent.click(screen.getByText("不吃辣"));
    expect(setChosenLimits).toHaveBeenCalledTimes(1);
  });

  it("adds a custom limit and resets the input", async () => {
    const setChosenLimits = vi.fn();
    const setOtherLimit = vi.fn();
    mockApp({
      otherLimit: "不吃动物内脏",
      setChosenLimits,
      setOtherLimit,
    });
    await renderPage();
    fireEvent.click(screen.getByText("确认添加"));
    expect(setChosenLimits).toHaveBeenCalledTimes(1);
    expect(setOtherLimit).toHaveBeenCalledWith("");
  });

  it("disables the custom-limit confirm button until something is typed", async () => {
    mockApp({ otherLimit: "" });
    await renderPage();
    expect(screen.getByText("确认添加")).toBeDisabled();
  });

  it("blocks submission and shows an error when time is missing", async () => {
    mockApp({ time: "" });
    await renderPage();
    const submit = screen.getByRole("button", { name: "帮我挑一挑" });
    fireEvent.click(submit);
    expect(submit).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("还有必填项没有选择，请检查后重试。");
  });

  it("disables submission and shows an empty-fridge label when the fridge has no ingredients", async () => {
    mockedExists.mockResolvedValue({ hasItems: false });
    await renderPage();
    expect(screen.getByText("冰箱空空的")).toBeDisabled();
  });

  it("proceeds to recommend once time and taste are chosen", async () => {
    vi.useFakeTimers();
    mockedSubmit.mockResolvedValue([]);
    const go = vi.fn();
    const setRecommendedRecipes = vi.fn();
    mockApp({
      time: "快速解决（15–30 分钟）",
      taste: "重口过瘾",
      go,
      setRecommendedRecipes,
    });
    await renderPage();
    fireEvent.click(screen.getByRole("button", { name: "帮我挑一挑" }));
    await vi.advanceTimersByTimeAsync(4200);
    expect(setRecommendedRecipes).toHaveBeenCalledWith([]);
    expect(go).toHaveBeenCalledWith("recommend");
    vi.useRealTimers();
  });
});

