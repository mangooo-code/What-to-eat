import assert from "node:assert/strict";
import test from "node:test";
import {
  countMembersByIds,
  createMember,
  deleteMember,
  listMembers,
  updateMember,
} from "./memberRepository";

let originalFetch: typeof fetch;

test.beforeEach(() => {
  originalFetch = globalThis.fetch;
  process.env.ENV_ID = "test-env";
  process.env.CLOUDBASE_API_KEY = "test-key";
});

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

const row = {
  id: "m1",
  ownerUserId: "u1",
  name: "A",
  relationship: "self",
  isOwner: true,
  tastePreference: null,
  dietPreference: null,
  dietaryRestrictions: [] as string[],
  allergens: [] as string[],
  createdDate: "d",
  updatedDate: "d",
};

function mockFetch(body: unknown, status = 200) {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
    calls.push({ url: url.toString(), init });
    return new Response(JSON.stringify(body), { status });
  }) as typeof fetch;
  return calls;
}

test("listMembers maps rows and requests excludeOwner when asked", async () => {
  const calls = mockFetch([row]);
  const members = await listMembers("u1", { excludeOwner: true });
  assert.deepEqual(members, [
    {
      memberId: "m1",
      ownerUserId: "u1",
      name: "A",
      relationship: "self",
      isOwner: true,
      tastePreference: null,
      dietPreference: null,
      dietaryRestrictions: [],
      allergens: [],
      createdDate: "d",
      updatedDate: "d",
    },
  ]);
  assert.match(calls[0].url, /isOwner=is\.false/);
});

test("createMember posts the input and returns the mapped record", async () => {
  const calls = mockFetch([row]);
  const member = await createMember("u1", {
    name: "A",
    relationship: "self",
    isOwner: true,
    tastePreference: null,
    dietPreference: null,
    dietaryRestrictions: [],
    allergens: [],
  });
  assert.equal(member.memberId, "m1");
  assert.equal(calls[0].init?.method, "POST");
});

test("updateMember with no changed fields re-fetches the current row", async () => {
  const calls = mockFetch([row]);
  const member = await updateMember("m1", "u1", {});
  assert.equal(member?.memberId, "m1");
  assert.equal(calls[0].init?.method ?? "GET", "GET");
});

test("updateMember with changes issues a PATCH and returns null when nothing matched", async () => {
  const calls = mockFetch([]);
  assert.equal(await updateMember("m1", "u1", { name: "B" }), null);
  assert.equal(calls[0].init?.method, "PATCH");
});

test("deleteMember reports whether a row was deleted", async () => {
  mockFetch([{ id: "m1" }]);
  assert.equal(await deleteMember("m1", "u1"), true);
  mockFetch([]);
  assert.equal(await deleteMember("m1", "u1"), false);
});

test("countMembersByIds returns 0 without a request when memberIds is empty", async () => {
  const calls = mockFetch([]);
  assert.equal(await countMembersByIds([], "u1"), 0);
  assert.equal(calls.length, 0);
});

test("countMembersByIds returns how many of the given ids belong to the owner", async () => {
  mockFetch([{ id: "m1" }, { id: "m2" }]);
  assert.equal(await countMembersByIds(["m1", "m2", "m3"], "u1"), 2);
});
