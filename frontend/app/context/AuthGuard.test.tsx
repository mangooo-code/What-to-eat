import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProvider, useApp } from "./AppContext";
import { authToken } from "../services/authToken";
import { userService } from "../services/userService";
import { memberService } from "../services/memberService";
import type { User } from "../types/domain";

const mockPush = vi.fn();
let mockPathname = "/fridge";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockPathname,
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
  return <output aria-label="auth-checked">{app.authChecked ? "checked" : "pending"}</output>;
}

describe("auth guard", () => {
  beforeEach(() => {
    localStorage.clear();
    mockPush.mockClear();
    vi.mocked(memberService.list).mockResolvedValue([]);
  });

  it("redirects an unauthenticated user away from a guarded page to /login", async () => {
    mockPathname = "/fridge";

    render(
      <AppProvider>
        <Harness />
      </AppProvider>,
    );

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/login"));
  });

  it("does not redirect an authenticated user viewing a guarded page", async () => {
    mockPathname = "/fridge";
    authToken.set(makeToken({ exp: Math.floor(Date.now() / 1000) + 3600 }));
    vi.mocked(userService.getProfile).mockResolvedValue(fakeUser);

    render(
      <AppProvider>
        <Harness />
      </AppProvider>,
    );

    await waitFor(() => expect(screen.getByLabelText("auth-checked")).toHaveTextContent("checked"));
    expect(mockPush).not.toHaveBeenCalledWith("/login");
  });

  it("redirects an authenticated user away from the login page to home", async () => {
    mockPathname = "/login";
    authToken.set(makeToken({ exp: Math.floor(Date.now() / 1000) + 3600 }));
    vi.mocked(userService.getProfile).mockResolvedValue(fakeUser);

    render(
      <AppProvider>
        <Harness />
      </AppProvider>,
    );

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/"));
  });
});
