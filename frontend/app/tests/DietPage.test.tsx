import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DietPage } from "../pages/DietPage";
import { useApp } from "../context/AppContext";
import { createAppState } from "./mockApp";

vi.mock("../context/AppContext", () => ({ useApp: vi.fn() }));
const mockedUseApp = vi.mocked(useApp);

function mockApp(overrides: Parameters<typeof createAppState>[0] = {}) {
  mockedUseApp.mockReturnValue(createAppState(overrides));
}

describe("DietPage", () => {
  it("shows the primary-user title and hides the name field for '我'", () => {
    mockApp({ draftProfileName: "我", profileName: "我" });
    render(<DietPage />);
    expect(screen.getByText("我的饮食档案")).toBeInTheDocument();
    expect(screen.queryByLabelText("成员姓名")).not.toBeInTheDocument();
    expect(screen.queryByText("删除成员")).not.toBeInTheDocument();
  });

  it("shows a member-specific title and name field", () => {
    mockApp({ draftProfileName: "阳", profileName: "阳" });
    render(<DietPage />);
    expect(screen.getByText("阳的饮食档案")).toBeInTheDocument();
    expect(screen.getByLabelText("成员姓名")).toHaveValue("阳");
  });

  it("disables saving when the name is cleared", () => {
    mockApp({ draftProfileName: "", profileName: "阳" });
    render(<DietPage />);
    expect(screen.getByText("保存")).toBeDisabled();
  });

  it("saves the profile and returns to the profile page", () => {
    const say = vi.fn();
    const go = vi.fn();
    const setProfileName = vi.fn();
    mockApp({ draftProfileName: "阳阳", profileName: "阳", say, go, setProfileName });
    render(<DietPage />);
    fireEvent.click(screen.getByText("保存"));
    expect(setProfileName).toHaveBeenCalledWith("阳阳");
    expect(say).toHaveBeenCalledWith("档案已保存");
    expect(go).toHaveBeenCalledWith("profile");
  });

  it("deletes a member and returns to the profile page", () => {
    const setPeople = vi.fn();
    const setMembers = vi.fn();
    const go = vi.fn();
    mockApp({ draftProfileName: "阳", profileName: "阳", setPeople, setMembers, go });
    render(<DietPage />);
    fireEvent.click(screen.getByText("删除成员"));
    expect(setPeople).toHaveBeenCalledTimes(1);
    expect(setMembers).toHaveBeenCalledTimes(1);
    expect(go).toHaveBeenCalledWith("profile");
  });
});
