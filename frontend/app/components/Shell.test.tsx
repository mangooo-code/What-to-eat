import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Shell } from "./Shell";
import { useApp } from "../context/AppContext";
import { inventoryService } from "../services/inventoryService";

vi.mock("../context/AppContext", () => ({
  useApp: vi.fn(),
}));

const mockedUseApp = vi.mocked(useApp);

function mockApp(overrides: Partial<ReturnType<typeof useApp>> = {}) {
  mockedUseApp.mockReturnValue({
    page: "home",
    authChecked: true,
    findRecipesSubmitting: false,
    go: vi.fn(),
    toast: "",
    legal: "",
    setLegal: vi.fn(),
    memberOpen: false,
    setMemberOpen: vi.fn(),
    memberMode: "add",
    newMemberName: "",
    setNewMemberName: vi.fn(),
    relation: "",
    setRelation: vi.fn(),
    saveMember: vi.fn(),
    memberSaving: false,
    draftTaste: "",
    setDraftTaste: vi.fn(),
    draftDiet: "",
    setDraftDiet: vi.fn(),
    draftLimits: [],
    setDraftLimits: vi.fn(),
    draftAllergens: [],
    setDraftAllergens: vi.fn(),
    dialog: "",
    setDialog: vi.fn(),
    logout: vi.fn(),
    say: vi.fn(),
    foods: [],
    setFoods: vi.fn(),
    editIndex: 0,
    ...overrides,
  } as unknown as ReturnType<typeof useApp>);
}

describe("Shell", () => {
  beforeEach(() => {
    mockApp();
  });

  it("renders its children", () => {
    render(
      <Shell>
        <p>页面内容</p>
      </Shell>,
    );
    expect(screen.getByText("页面内容")).toBeInTheDocument();
  });

  it("shows the bottom nav only when withNav is true", () => {
    const { rerender } = render(<Shell withNav={false}>内容</Shell>);
    expect(screen.queryByText("今天吃什么")).not.toBeInTheDocument();
    rerender(<Shell withNav>内容</Shell>);
    expect(screen.getByText("今天吃什么")).toBeInTheDocument();
  });

  it("shows the toast when present", () => {
    mockApp({ toast: "已保存" });
    render(<Shell>内容</Shell>);
    expect(screen.getByText("已保存")).toBeInTheDocument();
  });

  it("shows the legal overlay and closes it", () => {
    const setLegal = vi.fn();
    mockApp({ legal: "用户协议", setLegal });
    render(<Shell>内容</Shell>);
    expect(screen.getByRole("heading", { name: "用户协议" })).toBeInTheDocument();
    fireEvent.click(screen.getByText("×"));
    expect(setLegal).toHaveBeenCalledWith("");
  });

  it("shows the member modal and cancels it", () => {
    const setMemberOpen = vi.fn();
    mockApp({ memberOpen: true, setMemberOpen });
    render(<Shell>内容</Shell>);
    expect(screen.getByText("添加一起吃饭的人")).toBeInTheDocument();
    fireEvent.click(screen.getByText("取消"));
    expect(setMemberOpen).toHaveBeenCalledWith(false);
  });

  it("disables saving the member profile until name and relation are set", () => {
    mockApp({ memberOpen: true, newMemberName: "", relation: "" });
    render(<Shell>内容</Shell>);
    expect(screen.getByText("保存档案")).toBeDisabled();
  });

  it("logs out when the dialog confirms a logout", () => {
    const logout = vi.fn();
    mockApp({ dialog: "确定要退出登录吗？", logout });
    render(<Shell>内容</Shell>);
    fireEvent.click(screen.getByText("确认退出"));
    expect(logout).toHaveBeenCalledTimes(1);
  });

  it("removes the food item when the dialog confirms deletion", async () => {
    const setFoods = vi.fn();
    const go = vi.fn();
    vi.spyOn(inventoryService, "remove").mockResolvedValue(undefined);
    mockApp({
      dialog: "要移除这项食材吗？",
      setFoods,
      go,
      editIndex: 0,
      foods: [{ id: "10000000-0000-4000-8000-000000000001", name: "番茄", qty: 2, unit: "个", place: "冷藏", days: 3 }],
    });
    render(<Shell>内容</Shell>);
    fireEvent.click(screen.getByText("删除"));
    await waitFor(() => expect(setFoods).toHaveBeenCalledTimes(1));
    expect(go).toHaveBeenCalledWith("fridge");
  });

  it("navigates to the fridge when the empty-fridge dialog confirms", () => {
    const go = vi.fn();
    const setDialog = vi.fn();
    mockApp({ dialog: "冰箱还是空空的，先放点食材进来吧。", go, setDialog });
    render(<Shell>内容</Shell>);
    fireEvent.click(screen.getByText("打开冰箱"));
    expect(go).toHaveBeenCalledWith("fridge");
    expect(setDialog).toHaveBeenCalledWith("");
  });
});
