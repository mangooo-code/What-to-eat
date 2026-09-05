import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProvider, useApp } from "./AppContext";
import { authToken } from "../services/authToken";
import { userService } from "../services/userService";
import { memberService } from "../services/memberService";
import type { User } from "../types/domain";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/profile",
}));
vi.mock("../services/userService", () => ({
  userService: { getProfile: vi.fn() },
}));
vi.mock("../services/memberService", () => ({
  memberService: { list: vi.fn().mockResolvedValue([]) },
}));

function makeToken(claims: Record<string, unknown>): string {
  const payload = Buffer.from(JSON.stringify(claims), "utf8").toString("base64");
  return `header.${payload}.signature`;
}

const fakeUser: User = {
  id: "u1",
  phoneNumber: "13800000000",
  displayName: "测试用户",
  avatarFileId: null,
  createdDate: "2026-08-30T00:00:00.000Z",
  updatedDate: "2026-08-30T00:00:00.000Z",
};

function Harness() {
  const app = useApp();
  return (
    <>
      <output aria-label="current-user">{app.currentUser?.displayName ?? "none"}</output>
      <button onClick={() => app.logout()}>logout</button>
    </>
  );
}

describe("logout", () => {
  beforeEach(() => {
    localStorage.clear();
    mockPush.mockClear();
  });

  it("clears the stored jwt token, resets the current user, and navigates to the login page", async () => {
    authToken.set(makeToken({ exp: Math.floor(Date.now() / 1000) + 3600 }));
    vi.mocked(userService.getProfile).mockResolvedValue(fakeUser);
    vi.mocked(memberService.list).mockResolvedValue([]);

    render(
      <AppProvider>
        <Harness />
      </AppProvider>,
    );

    await waitFor(() => expect(screen.getByLabelText("current-user")).toHaveTextContent("测试用户"));

    fireEvent.click(screen.getByText("logout"));

    expect(localStorage.getItem("wte_auth_token")).toBeNull();
    expect(authToken.get()).toBeNull();
    expect(screen.getByLabelText("current-user")).toHaveTextContent("none");
    expect(mockPush).toHaveBeenCalledWith("/login");
  });
});
