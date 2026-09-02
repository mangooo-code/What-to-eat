import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import test from "node:test";
import { AppError } from "../../../shared/errors/AppError";
import type { HttpEvent } from "../../../shared/types/api";
import { handleLogin } from "./login";

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

function event(body: unknown): HttpEvent {
  return { httpMethod: "POST", body: JSON.stringify(body) };
}

test("rejects a request missing phoneNumber or password", async () => {
  await assert.rejects(
    handleLogin(event({ phoneNumber: "1" })),
    (error) => error instanceof AppError && error.code === "VALIDATION_ERROR",
  );
});

test("throws INVALID_CREDENTIALS when the phone number is unknown", async () => {
  globalThis.fetch = (async () => new Response("[]", { status: 200 })) as typeof fetch;
  await assert.rejects(
    handleLogin(event({ phoneNumber: "15555550100", password: "secret" })),
    (error) => error instanceof AppError && error.code === "INVALID_CREDENTIALS" && error.statusCode === 401,
  );
});

test("returns a bearer token for valid credentials", async () => {
  const salt = Buffer.alloc(16, 1).toString("hex");
  const responses = [
    [{ passwordSalt: salt }],
    [{ id: "u1", firstName: "A", middleName: null, lastName: "B", phoneNumber: "15555550100", displayName: "A", avatarFileId: null }],
  ];
  let index = 0;
  globalThis.fetch = (async () => new Response(JSON.stringify(responses[index++]), { status: 200 })) as typeof fetch;

  const response = await handleLogin(event({ phoneNumber: "15555550100", password: "secret" }));
  assert.equal(response.statusCode, 200);
  const payload = JSON.parse(response.body) as { success: boolean; data: string };
  assert.equal(payload.success, true);
  const decoded = jwt.verify(payload.data, "test-secret") as { sub: string };
  assert.equal(decoded.sub, "u1");
});
