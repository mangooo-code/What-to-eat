import { ApiClientError, apiClient } from "./apiClient";
import type { HouseholdMember } from "../types/domain";

export interface CreateMemberInput {
  name: string;
  relationship: string;
  isOwner?: boolean;
  tastePreference?: string | null;
  dietPreference?: string | null;
  dietaryRestrictions?: string[];
  allergens?: string[];
}

export type UpdateMemberInput = Partial<CreateMemberInput>;

function isHouseholdMember(value: unknown): value is HouseholdMember {
  if (!value || typeof value !== "object") return false;
  const member = value as Partial<HouseholdMember>;
  return typeof member.memberId === "string"
    && typeof member.ownerUserId === "string"
    && typeof member.name === "string"
    && typeof member.relationship === "string"
    && typeof member.isOwner === "boolean"
    && (member.tastePreference === null || typeof member.tastePreference === "string")
    && (member.dietPreference === null || typeof member.dietPreference === "string")
    && Array.isArray(member.dietaryRestrictions)
    && member.dietaryRestrictions.every((item) => typeof item === "string")
    && Array.isArray(member.allergens)
    && member.allergens.every((item) => typeof item === "string")
    && typeof member.createdDate === "string"
    && typeof member.updatedDate === "string";
}

function invalidMemberResponse(): never {
  throw new ApiClientError("INVALID_MEMBER_RESPONSE", "成员接口返回了无效的数据结构");
}

export function parseMemberListResponse(response: unknown): HouseholdMember[] {
  const candidate = Array.isArray(response)
    ? response
    : response && typeof response === "object" && "items" in response
      ? (response as Record<string, unknown>).items
      : response && typeof response === "object" && "data" in response
        ? (response as Record<string, unknown>).data
        : null;

  if (!Array.isArray(candidate) || !candidate.every(isHouseholdMember)) {
    return invalidMemberResponse();
  }
  return candidate;
}

function parseMemberResponse(response: unknown): HouseholdMember {
  const candidate = isHouseholdMember(response)
    ? response
    : response && typeof response === "object" && "item" in response
      ? (response as Record<string, unknown>).item
      : response && typeof response === "object" && "data" in response
        ? (response as Record<string, unknown>).data
        : null;
  if (!isHouseholdMember(candidate)) return invalidMemberResponse();
  return candidate;
}

export const memberService = {
  list: async (options?: { excludeOwner?: boolean }): Promise<HouseholdMember[]> => parseMemberListResponse(
    await apiClient.get<unknown>("/members", {
      query: options?.excludeOwner ? { excludeOwner: true } : undefined,
    }),
  ),
  create: async (input: CreateMemberInput): Promise<HouseholdMember> => parseMemberResponse(
    await apiClient.post<unknown, CreateMemberInput>("/members", input),
  ),
  update: async (memberId: string, input: UpdateMemberInput): Promise<HouseholdMember> => parseMemberResponse(
    await apiClient.patch<unknown, UpdateMemberInput>(`/members/${encodeURIComponent(memberId)}`, input),
  ),
  remove: async (memberId: string): Promise<void> => {
    await apiClient.delete<unknown>(`/members/${encodeURIComponent(memberId)}`);
  },
};
