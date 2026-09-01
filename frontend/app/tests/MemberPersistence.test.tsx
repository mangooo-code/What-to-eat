import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProvider, selectValidMemberIds, useApp } from "../context/AppContext";
import { memberService } from "../services/memberService";
import type { HouseholdMember } from "../types/domain";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/",
}));
vi.mock("../services/memberService", () => ({
  memberService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));
vi.mock("../services/authToken", () => ({
  authToken: { get: () => "test-token", set: vi.fn(), clear: vi.fn() },
}));
vi.mock("../services/userService", () => ({
  userService: { getProfile: vi.fn().mockResolvedValue(null) },
}));

const owner: HouseholdMember = {
  memberId: "10000000-0000-4000-8000-000000000101",
  ownerUserId: "c0ef3510-03b3-4024-a1e3-d85e53f2eb81",
  name: "我",
  relationship: "主用户",
  isOwner: true,
  tastePreference: "家常",
  dietPreference: "低脂",
  dietaryRestrictions: [],
  allergens: [],
  createdDate: "2026-08-30T00:00:00.000Z",
  updatedDate: "2026-08-30T00:00:00.000Z",
};

const partner: HouseholdMember = {
  ...owner,
  memberId: "10000000-0000-4000-8000-000000000102",
  name: "阳",
  relationship: "伴侣",
  isOwner: false,
};

function Harness() {
  const app = useApp();
  return (
    <>
      <output aria-label="member-count">{app.householdMembers.length}</output>
      <output aria-label="editor-state">{app.memberOpen ? "open" : "closed"}</output>
      <output aria-label="toast">{app.toast}</output>
      <button onClick={() => app.openMember("profile")}>open editor</button>
      <input aria-label="member name" value={app.newMemberName} onChange={(event) => app.setNewMemberName(event.target.value)} />
      <button onClick={() => app.setRelation("朋友")}>choose relation</button>
      <button onClick={() => app.saveMember()}>save member</button>
    </>
  );
}

describe("member persistence state", () => {
  beforeEach(() => {
    vi.mocked(memberService.list).mockResolvedValue([owner]);
    vi.mocked(memberService.create).mockReset();
  });

  it("keeps the original member data and editor open when create fails", async () => {
    vi.mocked(memberService.create).mockRejectedValue(new Error("service unavailable"));
    render(<AppProvider><Harness /></AppProvider>);
    await waitFor(() => expect(screen.getByLabelText("member-count")).toHaveTextContent("1"));

    fireEvent.click(screen.getByText("open editor"));
    fireEvent.change(screen.getByLabelText("member name"), { target: { value: "失败成员" } });
    fireEvent.click(screen.getByText("choose relation"));
    fireEvent.click(screen.getByText("save member"));

    await waitFor(() => expect(screen.getByLabelText("toast")).toHaveTextContent("成员保存失败"));
    expect(screen.getByLabelText("member-count")).toHaveTextContent("1");
    expect(screen.getByLabelText("editor-state")).toHaveTextContent("open");
  });

  it("keeps selected members that still exist", () => {
    expect(selectValidMemberIds([partner.memberId], [owner, partner])).toEqual([partner.memberId]);
  });

  it("falls back to the owner when the selected member no longer exists", () => {
    expect(selectValidMemberIds(["missing-member"], [owner, partner])).toEqual([owner.memberId]);
  });

  it("returns an empty selection for an empty member array", () => {
    expect(selectValidMemberIds([owner.memberId], [])).toEqual([]);
  });
});
