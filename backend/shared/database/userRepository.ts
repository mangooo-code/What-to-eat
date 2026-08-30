import { User } from "../types";
import { postgrestRequest } from "./postgrestClient";

export async function getSalt(phoneNumber: string): Promise<string | null> {
  const rows = await postgrestRequest<Array<{ passwordSalt: string | null }>>("Users", {
    query: { select: "passwordSalt", phoneNumber: `eq.${phoneNumber}`, limit: 1 },
  });
  return rows[0]?.passwordSalt ?? null;
}

export async function verifyCredentials(
  phoneNumber: string,
  hashedPassword: string,
): Promise<User | null> {
  const rows = await postgrestRequest<User[]>("Users", {
    query: {
      select: "id,firstName,middleName,lastName,phoneNumber,displayName,avatarFileId",
      phoneNumber: `eq.${phoneNumber}`,
      hashedPassword: `eq.${hashedPassword}`,
      limit: 1,
    },
  });
  return rows[0] ?? null;
}
