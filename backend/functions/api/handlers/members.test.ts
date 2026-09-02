import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import test from "node:test";
import { AppError } from "../../../shared/errors/AppError";
import type { HttpEvent } from "../../../shared/types/api";
import { handleMembers } from "./members";

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

function authHeader() {
  return { authorization: `Bearer ${jwt.sign({ sub: "u1" }, "test-secret")}` };
}

function mockFetch(body: unknown, status = 200) {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
    calls.push({ url: url.toString(), init });
    return new Response(JSON.stringify(body), { status });
  }) as typeof fetch;
  return calls;
}

const memberRow = {
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

test("requires authentication", async () => {
  await assert.rejects(
    handleMembers({ httpMethod: "GET", headers: {} } as HttpEvent),
    (error) => error instanceof AppError && error.code === "UNAUTHORIZED",
  );
});

test("GET lists members and forwards excludeOwner", async () => {
  const calls = mockFetch([memberRow]);
  const response = await handleMembers({
    httpMethod: "GET",
    headers: authHeader(),
    queryStringParameters: { excludeOwner: "true" },
  } as HttpEvent);
  assert.equal(response.statusCode, 200);
  assert.match(calls[0].url, /isOwner=is\.false/);
});

test("POST validates required fields", async () => {
  await assert.rejects(
    handleMembers({ httpMethod: "POST", headers: authHeader(), body: JSON.stringify({}) } as HttpEvent),
    (error) => error instanceof AppError && error.code === "VALIDATION_ERROR",
  );
});

test("POST rejects non-array dietaryRestrictions", async () => {
  await assert.rejects(
    handleMembers({
      httpMethod: "POST",
      headers: authHeader(),
      body: JSON.stringify({ name: "A", relationship: "self", dietaryRestrictions: "not-an-array" }),
    } as HttpEvent),
    (error) => error instanceof AppError && error.code === "VALIDATION_ERROR",
  );
});

test("POST creates a member", async () => {
  mockFetch([memberRow]);
  const response = await handleMembers({
    httpMethod: "POST",
    headers: authHeader(),
    body: JSON.stringify({ name: "A", relationship: "self" }),
  } as HttpEvent);
  assert.equal(response.statusCode, 201);
});

test("PATCH with a malformed id throws MEMBER_NOT_FOUND", async () => {
  await assert.rejects(
    handleMembers({
      httpMethod: "PATCH",
      headers: authHeader(),
      path: "/members/not-a-uuid",
      body: JSON.stringify({ name: "B" }),
    } as HttpEvent),
    (error) => error instanceof AppError && error.code === "MEMBER_NOT_FOUND" && error.statusCode === 404,
  );
});

test("PATCH returns MEMBER_NOT_FOUND when no row matches", async () => {
  mockFetch([]);
  await assert.rejects(
    handleMembers({
      httpMethod: "PATCH",
      headers: authHeader(),
      path: "/members/11111111-1111-4111-8111-111111111111",
      body: JSON.stringify({ name: "B" }),
    } as HttpEvent),
    (error) => error instanceof AppError && error.code === "MEMBER_NOT_FOUND",
  );
});

test("DELETE removes a member", async () => {
  mockFetch([{ id: "m1" }]);
  const response = await handleMembers({
    httpMethod: "DELETE",
    headers: authHeader(),
    path: "/members/11111111-1111-4111-8111-111111111111",
  } as HttpEvent);
  assert.equal(response.statusCode, 200);
});

test("rejects unsupported methods", async () => {
  await assert.rejects(
    handleMembers({ httpMethod: "PUT", headers: authHeader() } as HttpEvent),
    (error) => error instanceof AppError && error.code === "METHOD_NOT_ALLOWED",
  );
});
