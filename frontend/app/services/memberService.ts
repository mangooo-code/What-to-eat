import { apiClient } from "./apiClient";
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

export const memberService = {
  list: () => apiClient.get<HouseholdMember[]>("/members"),
  create: (input: CreateMemberInput) => apiClient.post<HouseholdMember, CreateMemberInput>("/members", input),
  update: (memberId: string, input: UpdateMemberInput) => apiClient.patch<HouseholdMember, UpdateMemberInput>(`/members/${encodeURIComponent(memberId)}`, input),
  remove: (memberId: string) => apiClient.delete<void>(`/members/${encodeURIComponent(memberId)}`),
};
