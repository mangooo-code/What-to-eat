import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";
import jwt from "jsonwebtoken";
import { AppError } from "../../../shared/errors/AppError";
import { getSalt, verifyCredentials } from "../../../shared/database";
import { getJwtSecret } from "../../../shared/auth";
import type { User } from "../../../shared/types";

const scryptAsync = promisify(scrypt);
const MAX_PASSWORD_LENGTH = 256;
// Only used to keep hashing time constant when no account exists; never used for real verification.
const DUMMY_SALT = Buffer.alloc(16);

export async function hashPassword(
  password: string,
  salt: Buffer = randomBytes(16),
): Promise<{ salt: string; hashedPassword: string }> {
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return { salt: salt.toString("hex"), hashedPassword: derived.toString("hex") };
}

export async function authenticate(phoneNumber: string, password: string): Promise<User | null> {
  if (password.length > MAX_PASSWORD_LENGTH) {
    throw new AppError("VALIDATION_ERROR", "password is too long");
  }

  const salt = await getSalt(phoneNumber);
  // Always hash, even for unknown accounts, so response timing doesn't reveal which phone numbers are registered.
  const { hashedPassword } = await hashPassword(password, salt ? Buffer.from(salt, "hex") : DUMMY_SALT);
  if (!salt) return null;

  return verifyCredentials(phoneNumber, hashedPassword);
}

export function buildBearerToken(user: User): string {
  return jwt.sign({ sub: user.id }, getJwtSecret(), { expiresIn: "12h" });
}

