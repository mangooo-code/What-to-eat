import assert from "node:assert/strict";
import test from "node:test";
import { getSalt, getUserById, verifyCredentials } from "./userRepository";

let originalFetch: typeof fetch;

test.beforeEach(() => {
  originalFetch = globalThis.fetch;
  process.env.ENV_ID = "test-env";
  process.env.CLOUDBASE_API_KEY = "test-key";
});

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

function mockFetchOnce(body: unknown, status = 200) {
  let capturedUrl = "";
  globalThis.fetch = (async (url: string | URL) => {
    capturedUrl = url.toString();
    return new Response(JSON.stringify(body), { status });
  }) as typeof fetch;
  return () => capturedUrl;
}

test("getSalt returns the stored passwordSalt for a known phone number", async () => {
  const getUrl = mockFetchOnce([{ passwordSalt: "abc123" }]);
  assert.equal(await getSalt("15555550100"), "abc123");
  assert.match(getUrl(), /select=passwordSalt/);
  assert.match(getUrl(), /phoneNumber=eq\.15555550100/);
});

test("getSalt returns null for an unknown phone number", async () => {
  mockFetchOnce([]);
  assert.equal(await getSalt("00000000000"), null);
});

test("getUserById returns the mapped user or null", async () => {
  const user = { id: "u1", firstName: "A", middleName: null, lastName: "B", phoneNumber: "1", displayName: "A", avatarFileId: null };
  mockFetchOnce([user]);
  assert.deepEqual(await getUserById("u1"), user);

  mockFetchOnce([]);
  assert.equal(await getUserById("missing"), null);
});

test("verifyCredentials filters by phoneNumber and hashedPassword", async () => {
  const getUrl = mockFetchOnce([{ id: "u1" }]);
  await verifyCredentials("1", "hash");
  assert.match(getUrl(), /hashedPassword=eq\.hash/);
});
