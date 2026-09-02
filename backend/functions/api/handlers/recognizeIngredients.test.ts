import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import test from "node:test";
import { AppError } from "../../../shared/errors/AppError";
import type { HttpEvent } from "../../../shared/types/api";
import { handleRecognizeIngredients } from "./recognizeIngredients";

let originalFetch: typeof fetch;

test.beforeEach(() => {
  originalFetch = globalThis.fetch;
  process.env.JWT_SECRET = "test-secret";
  process.env.ALIYUN_API_KEY = "test-key";
  process.env.ALIYUN_BASE_URL = "https://fake-aliyun.test";
});

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

function authHeader() {
  return { authorization: `Bearer ${jwt.sign({ sub: "u1" }, "test-secret")}` };
}

function multipartBody(boundary: string, parts: Array<{ content: string; mimeType?: string; filename?: string }>) {
  const segments = parts.map((part) =>
    [
      `--${boundary}`,
      `Content-Disposition: form-data; name="image"; filename="${part.filename ?? "photo.jpg"}"`,
      `Content-Type: ${part.mimeType ?? "image/jpeg"}`,
      "",
      part.content,
    ].join("\r\n"),
  );
  return [...segments, `--${boundary}--`, ""].join("\r\n");
}

function multipartEvent(overrides: Partial<HttpEvent> = {}): HttpEvent {
  const boundary = "TESTBOUNDARY";
  return {
    httpMethod: "POST",
    headers: { "content-type": `multipart/form-data; boundary=${boundary}`, ...authHeader() },
    body: multipartBody(boundary, [{ content: "fake-image-bytes" }]),
    ...overrides,
  };
}

test("rejects non-POST methods", async () => {
  await assert.rejects(
    handleRecognizeIngredients({ httpMethod: "GET" } as HttpEvent),
    (error) => error instanceof AppError && error.code === "METHOD_NOT_ALLOWED",
  );
});

test("requires authentication", async () => {
  const event = multipartEvent({
    headers: { "content-type": "multipart/form-data; boundary=TESTBOUNDARY" },
  });
  await assert.rejects(
    handleRecognizeIngredients(event),
    (error) => error instanceof AppError && error.code === "UNAUTHORIZED",
  );
});

test("requires exactly one image file", async () => {
  const boundary = "TESTBOUNDARY";
  await assert.rejects(
    handleRecognizeIngredients({
      httpMethod: "POST",
      headers: { "content-type": `multipart/form-data; boundary=${boundary}`, ...authHeader() },
      body: [`--${boundary}--`, ""].join("\r\n"),
    } as HttpEvent),
    (error) => error instanceof AppError && error.code === "IMAGE_REQUIRED",
  );
});

test("rejects non-image mime types", async () => {
  const boundary = "TESTBOUNDARY";
  await assert.rejects(
    handleRecognizeIngredients({
      httpMethod: "POST",
      headers: { "content-type": `multipart/form-data; boundary=${boundary}`, ...authHeader() },
      body: multipartBody(boundary, [{ content: "not an image", mimeType: "text/plain", filename: "doc.txt" }]),
    } as HttpEvent),
    (error) => error instanceof AppError && error.code === "INVALID_IMAGE_TYPE",
  );
});

test("rejects an empty image file", async () => {
  const boundary = "TESTBOUNDARY";
  await assert.rejects(
    handleRecognizeIngredients({
      httpMethod: "POST",
      headers: { "content-type": `multipart/form-data; boundary=${boundary}`, ...authHeader() },
      body: multipartBody(boundary, [{ content: "" }]),
    } as HttpEvent),
    (error) => error instanceof AppError && error.code === "EMPTY_IMAGE",
  );
});

test("returns recognized ingredients for a valid image upload", async () => {
  const aiBody = {
    output: { choices: [{ message: { content: [{ text: JSON.stringify({ items: [] }) }] } }] },
  };
  globalThis.fetch = (async () => new Response(JSON.stringify(aiBody), { status: 200 })) as typeof fetch;

  const response = await handleRecognizeIngredients(multipartEvent());
  assert.deepEqual(JSON.parse(response.body), { success: true, data: { items: [] } });
});
