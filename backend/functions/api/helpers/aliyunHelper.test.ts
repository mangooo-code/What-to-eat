import assert from "node:assert/strict";
import test from "node:test";
import { AppError } from "../../../shared/errors/AppError";
import { generate, testConnection } from "./aliyunHelper";

const ORIGINAL_ENV = { ...process.env };
let originalFetch: typeof fetch;

test.beforeEach(() => {
  originalFetch = globalThis.fetch;
  process.env.ALIYUN_API_KEY = "test-aliyun-key";
  delete process.env.ALIYUN_BASE_URL;
  delete process.env.ALIYUN_MODEL;
});

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  process.env = { ...ORIGINAL_ENV };
});

test("throws ALIYUN_API_KEY_NOT_CONFIGURED when ALIYUN_API_KEY is missing", async () => {
  delete process.env.ALIYUN_API_KEY;
  await assert.rejects(
    generate([{ role: "user", content: [{ text: "hi" }] }]),
    (error) => error instanceof AppError && error.code === "ALIYUN_API_KEY_NOT_CONFIGURED",
  );
});

test("posts to the default DashScope base URL/model and returns the joined text", async () => {
  let capturedUrl = "";
  let capturedInit: RequestInit | undefined;
  globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
    capturedUrl = url.toString();
    capturedInit = init;
    return new Response(
      JSON.stringify({ output: { choices: [{ message: { content: [{ text: "你好" }] } }] } }),
      { status: 200 },
    );
  }) as typeof fetch;

  const text = await generate([{ role: "user", content: [{ text: "hi" }] }]);

  assert.equal(text, "你好");
  assert.equal(capturedUrl, "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation");
  assert.equal(capturedInit?.method, "POST");
  const headers = capturedInit?.headers as Record<string, string>;
  assert.equal(headers.Authorization, "Bearer test-aliyun-key");
  const body = JSON.parse(String(capturedInit?.body)) as { model: string; input: { messages: unknown } };
  assert.equal(body.model, "qwen3.8-max");
  assert.deepEqual(body.input.messages, [{ role: "user", content: [{ text: "hi" }] }]);
});

test("uses ALIYUN_BASE_URL and ALIYUN_MODEL env vars when configured", async () => {
  process.env.ALIYUN_BASE_URL = "https://custom.example.com/api/v1";
  process.env.ALIYUN_MODEL = "custom-model";
  let capturedUrl = "";
  let capturedBody = "";
  globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
    capturedUrl = url.toString();
    capturedBody = String(init?.body);
    return new Response(JSON.stringify({ output: { choices: [{ message: { content: [{ text: "ok" }] } }] } }), { status: 200 });
  }) as typeof fetch;

  await generate([{ role: "user", content: [{ text: "hi" }] }]);

  assert.equal(capturedUrl, "https://custom.example.com/api/v1/services/aigc/multimodal-generation/generation");
  assert.equal(JSON.parse(capturedBody).model, "custom-model");
});

test("joins multiple text content parts into one string", async () => {
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({ output: { choices: [{ message: { content: [{ text: "第一" }, { text: "第二" }] } }] } }),
      { status: 200 },
    )) as typeof fetch;

  assert.equal(await generate([{ role: "user", content: [{ text: "hi" }] }]), "第一第二");
});

test("throws ALIYUN_REQUEST_FAILED with the status and response detail on a non-ok response", async () => {
  globalThis.fetch = (async () => new Response("rate limited", { status: 429 })) as typeof fetch;

  await assert.rejects(
    generate([{ role: "user", content: [{ text: "hi" }] }]),
    (error) =>
      error instanceof AppError &&
      error.code === "ALIYUN_REQUEST_FAILED" &&
      error.statusCode === 502 &&
      error.message.includes("429") &&
      error.message.includes("rate limited"),
  );
});

test("throws ALIYUN_EMPTY_RESPONSE when no content parts are present", async () => {
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ output: { choices: [{ message: { content: [] } }] } }), { status: 200 })) as typeof fetch;

  await assert.rejects(
    generate([{ role: "user", content: [{ text: "hi" }] }]),
    (error) => error instanceof AppError && error.code === "ALIYUN_EMPTY_RESPONSE",
  );
});

test("propagates the abort error when the request exceeds its timeout", async () => {
  globalThis.fetch = ((_url: string | URL, init?: RequestInit) =>
    new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => {
        const error = new Error("aborted");
        error.name = "AbortError";
        reject(error);
      });
    })) as typeof fetch;

  await assert.rejects(
    generate([{ role: "user", content: [{ text: "hi" }] }], { timeoutMs: 5 }),
    (error) => error instanceof Error && error.name === "AbortError",
  );
});

test("testConnection resolves true when generate succeeds", async () => {
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ output: { choices: [{ message: { content: [{ text: "pong" }] } }] } }), { status: 200 })) as typeof fetch;

  assert.equal(await testConnection(), true);
});

test("testConnection propagates the error when generate fails", async () => {
  globalThis.fetch = (async () => new Response("down", { status: 500 })) as typeof fetch;

  await assert.rejects(
    testConnection(),
    (error) => error instanceof AppError && error.code === "ALIYUN_REQUEST_FAILED",
  );
});
