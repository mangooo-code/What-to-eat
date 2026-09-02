import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import test from "node:test";
import { AppError } from "../../../shared/errors/AppError";
import { authenticate, buildBearerToken, hashPassword } from "./AuthenticationHelper";

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

test("hashPassword derives a deterministic hash for a given salt", async () => {
  const salt = Buffer.alloc(16, 7);
  const first = await hashPassword("hunter2", salt);
  const second = await hashPassword("hunter2", salt);
  assert.equal(first.hashedPassword, second.hashedPassword);
  assert.equal(first.salt, salt.toString("hex"));
});

test("hashPassword produces different hashes for different passwords", async () => {
  const salt = Buffer.alloc(16, 7);
  const a = await hashPassword("hunter2", salt);
  const b = await hashPassword("different", salt);
  assert.notEqual(a.hashedPassword, b.hashedPassword);
});

test("authenticate rejects overly long passwords before touching the database", async () => {
  let called = false;
  globalThis.fetch = (async () => {
    called = true;
    return new Response("[]", { status: 200 });
  }) as typeof fetch;
  await assert.rejects(
    authenticate("1", "x".repeat(300)),
    (error) => error instanceof AppError && error.code === "VALIDATION_ERROR",
  );
  assert.equal(called, false);
});

test("authenticate returns null for an unknown phone number", async () => {
  globalThis.fetch = (async () => new Response("[]", { status: 200 })) as typeof fetch;
  assert.equal(await authenticate("15555550100", "secret"), null);
});

test("authenticate returns the user when the password matches", async () => {
  const salt = Buffer.alloc(16, 3);
  const { hashedPassword } = await hashPassword("secret", salt);
  const user = { id: "u1", firstName: "A", middleName: null, lastName: "B", phoneNumber: "1", displayName: "A", avatarFileId: null };
  let call = 0;
  globalThis.fetch = (async (url: string | URL) => {
    call++;
    if (call === 1) return new Response(JSON.stringify([{ passwordSalt: salt.toString("hex") }]), { status: 200 });
    assert.match(url.toString(), new RegExp(`hashedPassword=eq\\.${hashedPassword}`));
    return new Response(JSON.stringify([user]), { status: 200 });
  }) as typeof fetch;
  assert.deepEqual(await authenticate("1", "secret"), user);
});

test("buildBearerToken signs a token containing the user's id", () => {
  const token = buildBearerToken({
    id: "u1",
    firstName: "A",
    middleName: null,
    lastName: "B",
    phoneNumber: "1",
    displayName: "A",
    avatarFileId: null,
  });
  const decoded = jwt.verify(token, "test-secret") as { sub: string };
  assert.equal(decoded.sub, "u1");
});
