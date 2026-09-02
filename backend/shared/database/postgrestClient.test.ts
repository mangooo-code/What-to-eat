import assert from "node:assert/strict";
import test from "node:test";
import { AppError } from "../errors/AppError";
import { postgrestRequest } from "./postgrestClient";

const ORIGINAL_ENV = { ...process.env };
let originalFetch: typeof fetch;

test.beforeEach(() => {
  originalFetch = globalThis.fetch;
  process.env.ENV_ID = "test-env";
  process.env.CLOUDBASE_API_KEY = "test-key";
  delete process.env.DATABASE_HTTP_TIMEOUT_MS;
});

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  process.env = { ...ORIGINAL_ENV };
});

test("throws DATABASE_HTTP_NOT_CONFIGURED when ENV_ID is missing", async () => {
  delete process.env.ENV_ID;
  await assert.rejects(
    postgrestRequest("Users"),
    (error) => error instanceof AppError && error.code === "DATABASE_HTTP_NOT_CONFIGURED",
  );
});

test("throws DATABASE_HTTP_NOT_CONFIGURED when CLOUDBASE_API_KEY is missing", async () => {
  delete process.env.CLOUDBASE_API_KEY;
  await assert.rejects(
    postgrestRequest("Users"),
    (error) => error instanceof AppError && error.code === "DATABASE_HTTP_NOT_CONFIGURED",
  );
});

test("builds the request URL/method/headers and returns parsed JSON on success", async () => {
  let capturedUrl = "";
  let capturedInit: RequestInit | undefined;
  globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
    capturedUrl = url.toString();
    capturedInit = init;
    return new Response(JSON.stringify([{ id: "1" }]), { status: 200 });
  }) as typeof fetch;

  const result = await postgrestRequest("Users", { query: { select: "id", id: "eq.1" } });

  assert.deepEqual(result, [{ id: "1" }]);
  assert.equal(capturedUrl, "https://test-env.api.tcloudbasegateway.com/v1/rdb/rest/Users?select=id&id=eq.1");
  assert.equal(capturedInit?.method, "GET");
  const headers = capturedInit?.headers as Record<string, string>;
  assert.equal(headers.Authorization, "Bearer test-key");
});

test("includes a JSON body, Content-Type, and Prefer header when provided", async () => {
  let capturedInit: RequestInit | undefined;
  globalThis.fetch = (async (_url, init) => {
    capturedInit = init;
    return new Response("[]", { status: 200 });
  }) as typeof fetch;

  await postgrestRequest("Users", { method: "POST", body: { name: "a" }, prefer: "return=representation" });

  assert.equal(capturedInit?.body, JSON.stringify({ name: "a" }));
  const headers = capturedInit?.headers as Record<string, string>;
  assert.equal(headers["Content-Type"], "application/json");
  assert.equal(headers.Prefer, "return=representation");
});

test("returns null for an empty response body", async () => {
  globalThis.fetch = (async () => new Response(null, { status: 204 })) as typeof fetch;
  assert.equal(await postgrestRequest("Users", { method: "DELETE" }), null);
});

test("throws DATABASE_HTTP_ERROR with the response message on non-ok responses", async () => {
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ message: "duplicate key" }), { status: 409 })) as typeof fetch;

  await assert.rejects(
    postgrestRequest("Users"),
    (error) =>
      error instanceof AppError &&
      error.code === "DATABASE_HTTP_ERROR" &&
      error.message === "duplicate key" &&
      error.statusCode === 502,
  );
});

test("throws DATABASE_HTTP_TIMEOUT when the request aborts", async () => {
  process.env.DATABASE_HTTP_TIMEOUT_MS = "5";
  globalThis.fetch = ((_url: string | URL, init?: RequestInit) =>
    new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => {
        const error = new Error("aborted");
        error.name = "AbortError";
        reject(error);
      });
    })) as typeof fetch;

  await assert.rejects(
    postgrestRequest("Users"),
    (error) => error instanceof AppError && error.code === "DATABASE_HTTP_TIMEOUT" && error.statusCode === 504,
  );
});
