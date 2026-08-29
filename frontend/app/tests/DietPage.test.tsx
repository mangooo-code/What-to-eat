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
    mockApp({ draftProfileName: "阳", profileName: "阳", profileMemberId: "22222222-2222-4222-8222-222222222222" });
    render(<DietPage />);
    expect(screen.getByText("阳的饮食档案")).toBeInTheDocument();
    expect(screen.getByLabelText("成员姓名")).toHaveValue("阳");
  });

  it("disables saving when the name is cleared", () => {
    mockApp({ draftProfileName: "", profileName: "阳", profileMemberId: "22222222-2222-4222-8222-222222222222" });
    render(<DietPage />);
    expect(screen.getByText("保存")).toBeDisabled();
  });

  it("saves the profile and returns to the profile page", () => {
    const go = vi.fn();
    const saveDietProfile = vi.fn().mockResolvedValue(true);
    mockApp({ draftProfileName: "阳阳", profileName: "阳", profileMemberId: "22222222-2222-4222-8222-222222222222", go, saveDietProfile });
    render(<DietPage />);
    fireEvent.click(screen.getByText("保存"));
    expect(saveDietProfile).toHaveBeenCalledTimes(1);
  });

  it("deletes a member and returns to the profile page", () => {
    const deleteProfileMember = vi.fn().mockResolvedValue(true);
    mockApp({ draftProfileName: "阳", profileName: "阳", profileMemberId: "22222222-2222-4222-8222-222222222222", deleteProfileMember });
    render(<DietPage />);
    fireEvent.click(screen.getByText("删除成员"));
    expect(deleteProfileMember).toHaveBeenCalledTimes(1);
  });
});
