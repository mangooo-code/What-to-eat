import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "../services/apiClient";
import { memberService, parseMemberListResponse } from "../services/memberService";
import type { HouseholdMember } from "../types/domain";

const owner: HouseholdMember = {
  memberId: "10000000-0000-4000-8000-000000000101",
  ownerUserId: "20000000-0000-4000-8000-000000000101",
  name: "我",
  relationship: "主用户",
  isOwner: true,
  tastePreference: null,
  dietPreference: null,
  dietaryRestrictions: [],
  allergens: [],
  createdDate: "2026-08-30T00:00:00.000Z",
  updatedDate: "2026-08-30T00:00:00.000Z",
};

describe("memberService response contract", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("returns a normal member array", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([owner]);
    await expect(memberService.list()).resolves.toEqual([owner]);
  });

  it("preserves the remote excludeOwner query option", async () => {
    const get = vi.spyOn(apiClient, "get").mockResolvedValue([owner]);
    await memberService.list({ excludeOwner: true });
    expect(get).toHaveBeenCalledWith("/members", { query: { excludeOwner: true } });
  });

  it("unwraps an items response at the service boundary", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue({ items: [owner] });
    await expect(memberService.list()).resolves.toEqual([owner]);
  });

  it("unwraps a nested data response at the service boundary", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue({ data: [owner] });
    await expect(memberService.list()).resolves.toEqual([owner]);
  });

  it("rejects an invalid list instead of leaking an object to AppContext", () => {
    try {
      parseMemberListResponse({ items: { member: owner } });
      throw new Error("Expected invalid member response to throw");
    } catch (error) {
      expect(error).toMatchObject({ code: "INVALID_MEMBER_RESPONSE" });
    }
  });

  it("normalizes wrapped create and update responses", async () => {
    vi.spyOn(apiClient, "post").mockResolvedValue({ item: owner });
    vi.spyOn(apiClient, "patch").mockResolvedValue({ data: owner });

    await expect(memberService.create({ name: "我", relationship: "主用户" })).resolves.toEqual(owner);
    await expect(memberService.update(owner.memberId, { name: "我" })).resolves.toEqual(owner);
  });

  it("normalizes delete to void", async () => {
    vi.spyOn(apiClient, "delete").mockResolvedValue({ deleted: true });
    await expect(memberService.remove(owner.memberId)).resolves.toBeUndefined();
  });
});
