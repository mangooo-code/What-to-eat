import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemberPage } from "./MemberPage";
import { useApp } from "../context/AppContext";
import { createAppState } from "../tests/mockApp";

vi.mock("../context/AppContext", () => ({ useApp: vi.fn() }));
const mockedUseApp = vi.mocked(useApp);

function mockApp(overrides: Parameters<typeof createAppState>[0] = {}) {
  mockedUseApp.mockReturnValue(createAppState(overrides));
}

describe("MemberPage", () => {
  beforeEach(() => {
    mockApp();
  });

  it("disables saving until a name and relation are chosen", () => {
    mockApp({ newMemberName: "", relation: "" });
    render(<MemberPage />);
    expect(screen.getByText("保存")).toBeDisabled();
  });

  it("selects a relation", () => {
    const setRelation = vi.fn();
    mockApp({ setRelation });
    render(<MemberPage />);
    fireEvent.click(screen.getByText("家人"));
    expect(setRelation).toHaveBeenCalledWith("家人");
  });

  it("saves the new member and navigates back to findrecipes", () => {
    const saveMember = vi.fn().mockResolvedValue(true);
    const go = vi.fn();
    mockApp({
      newMemberName: "阳阳",
      relation: "伴侣",
      saveMember,
      go,
    });
    render(<MemberPage />);
    fireEvent.click(screen.getByText("保存"));
    expect(saveMember).toHaveBeenCalledTimes(1);
  });

  it("goes back to findrecipes via the header back button", () => {
    const go = vi.fn();
    mockApp({ go });
    render(<MemberPage />);
    fireEvent.click(screen.getByRole("button", { name: /返回/ }));
    expect(go).toHaveBeenCalledWith("findrecipes");
  });
});
