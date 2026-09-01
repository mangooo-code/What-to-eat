import type { HouseholdMember } from "../types/domain";
import { postgrestRequest } from "./postgrestClient";

interface HouseholdMemberRow {
  id: string;
  ownerUserId: string;
  name: string;
  relationship: string;
  isOwner: boolean;
  tastePreference: string | null;
  dietPreference: string | null;
  dietaryRestrictions: string[];
  allergens: string[];
  createdDate: string;
  updatedDate: string;
}

export interface CreateMemberRecord {
  name: string;
  relationship: string;
  isOwner: boolean;
  tastePreference: string | null;
  dietPreference: string | null;
  dietaryRestrictions: string[];
  allergens: string[];
}

export type UpdateMemberRecord = Partial<CreateMemberRecord>;

const memberColumns = [
  "id", "ownerUserId", "name", "relationship", "isOwner", "tastePreference",
  "dietPreference", "dietaryRestrictions", "allergens", "createdDate", "updatedDate",
].join(",");

function mapMember(row: HouseholdMemberRow): HouseholdMember {
  return {
    memberId: row.id,
    ownerUserId: row.ownerUserId,
    name: row.name,
    relationship: row.relationship,
    isOwner: row.isOwner,
    tastePreference: row.tastePreference,
    dietPreference: row.dietPreference,
    dietaryRestrictions: row.dietaryRestrictions,
    allergens: row.allergens,
    createdDate: row.createdDate,
    updatedDate: row.updatedDate,
  };
}

export async function listMembers(
  ownerUserId: string,
  options: { excludeOwner?: boolean } = {},
): Promise<HouseholdMember[]> {
  const rows = await postgrestRequest<HouseholdMemberRow[]>("HouseholdMembers", {
    query: {
      select: memberColumns,
      ownerUserId: `eq.${ownerUserId}`,
      ...(options.excludeOwner ? { isOwner: "is.false" } : {}),
      order: "isOwner.desc,createdDate.asc,id.asc",
    },
  });
  return rows.map(mapMember);
}

export async function createMember(
  ownerUserId: string,
  input: CreateMemberRecord,
): Promise<HouseholdMember> {
  const rows = await postgrestRequest<HouseholdMemberRow[]>("HouseholdMembers", {
    method: "POST",
    query: { select: memberColumns },
    prefer: "return=representation",
    body: { ownerUserId, ...input },
  });
  return mapMember(rows[0]);
}

export async function updateMember(
  memberId: string,
  ownerUserId: string,
  input: UpdateMemberRecord,
): Promise<HouseholdMember | null> {
  const entries = Object.entries(input).filter(([, value]) => value !== undefined);
  if (!entries.length) {
    const rows = await postgrestRequest<HouseholdMemberRow[]>("HouseholdMembers", {
      query: { select: memberColumns, id: `eq.${memberId}`, ownerUserId: `eq.${ownerUserId}`, limit: 1 },
    });
    return rows[0] ? mapMember(rows[0]) : null;
  }
  const rows = await postgrestRequest<HouseholdMemberRow[]>("HouseholdMembers", {
    method: "PATCH",
    query: { select: memberColumns, id: `eq.${memberId}`, ownerUserId: `eq.${ownerUserId}` },
    prefer: "return=representation",
    body: { ...Object.fromEntries(entries), updatedDate: new Date().toISOString() },
  });
  return rows[0] ? mapMember(rows[0]) : null;
}

export async function deleteMember(memberId: string, ownerUserId: string): Promise<boolean> {
  const rows = await postgrestRequest<Array<{ id: string }>>("HouseholdMembers", {
    method: "DELETE",
    query: { select: "id", id: `eq.${memberId}`, ownerUserId: `eq.${ownerUserId}` },
    prefer: "return=representation",
  });
  return rows.length > 0;
}
