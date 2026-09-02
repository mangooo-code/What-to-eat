import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import test from "node:test";
import { AppError } from "../../../shared/errors/AppError";
import type { HttpEvent } from "../../../shared/types/api";
import { handleUser } from "./user";

let originalFetch: typeof fetch;

test.beforeEach(() => {
  originalFetch = globalThis.fetch;
  process.env.ENV_ID = "test-env";
  process.env.CLOUDBASE_API_KEY = "test-key";
  process.env.JWT_SECRET = "test-secret";
});

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

function authHeader(userId: string) {
  return { authorization: `Bearer ${jwt.sign({ sub: userId }, "test-secret")}` };
}

test("rejects non-GET methods", async () => {
  await assert.rejects(
    handleUser({ httpMethod: "POST", headers: authHeader("u1") } as HttpEvent),
    (error) => error instanceof AppError && error.code === "METHOD_NOT_ALLOWED",
  );
});

test("requires authentication", async () => {
  await assert.rejects(
    handleUser({ httpMethod: "GET", headers: {} } as HttpEvent),
    (error) => error instanceof AppError && error.code === "UNAUTHORIZED",
  );
});

test("throws USER_NOT_FOUND when the user doesn't exist", async () => {
  globalThis.fetch = (async () => new Response("[]", { status: 200 })) as typeof fetch;
  await assert.rejects(
    handleUser({ httpMethod: "GET", headers: authHeader("missing") } as HttpEvent),
    (error) => error instanceof AppError && error.code === "USER_NOT_FOUND" && error.statusCode === 404,
  );
});

test("returns the authenticated user", async () => {
  const user = { id: "u1", firstName: "A", middleName: null, lastName: "B", phoneNumber: "1", displayName: "A", avatarFileId: null };
  globalThis.fetch = (async () => new Response(JSON.stringify([user]), { status: 200 })) as typeof fetch;
  const response = await handleUser({ httpMethod: "GET", headers: authHeader("u1") } as HttpEvent);
  assert.deepEqual(JSON.parse(response.body), { success: true, data: user });
});
