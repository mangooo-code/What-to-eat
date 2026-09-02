import assert from "node:assert/strict";
import test from "node:test";
import { AppError } from "../errors/AppError";
import type { HttpEvent } from "../types/api";
import { getMethod, getQueryParams, parseJsonBody, requireString } from "./http";

test("getMethod reads httpMethod and uppercases it", () => {
  assert.equal(getMethod({ httpMethod: "post" } as HttpEvent), "POST");
});

test("getMethod falls back to requestContext.httpMethod", () => {
  assert.equal(getMethod({ requestContext: { httpMethod: "patch" } } as HttpEvent), "PATCH");
});

test("getMethod returns an empty string when neither is set", () => {
  assert.equal(getMethod({} as HttpEvent), "");
});

test("getQueryParams builds URLSearchParams, skipping undefined values", () => {
  const params = getQueryParams({ queryStringParameters: { a: "1", b: undefined } } as HttpEvent);
  assert.equal(params.get("a"), "1");
  assert.equal(params.has("b"), false);
});

test("parseJsonBody returns an object body as-is", () => {
  assert.deepEqual(parseJsonBody({ body: { a: 1 } } as unknown as HttpEvent), { a: 1 });
});

test("parseJsonBody parses a JSON string body", () => {
  assert.deepEqual(parseJsonBody({ body: '{"a":1}' } as HttpEvent), { a: 1 });
});

test("parseJsonBody decodes a base64-encoded body", () => {
  const encoded = Buffer.from('{"a":1}', "utf8").toString("base64");
  assert.deepEqual(parseJsonBody({ body: encoded, isBase64Encoded: true } as HttpEvent), { a: 1 });
});

test("parseJsonBody throws INVALID_REQUEST when the body is null or missing", () => {
  assert.throws(
    () => parseJsonBody({ body: null } as HttpEvent),
    (error) => error instanceof AppError && error.code === "INVALID_REQUEST",
  );
  assert.throws(
    () => parseJsonBody({} as HttpEvent),
    (error) => error instanceof AppError && error.code === "INVALID_REQUEST",
  );
});

test("parseJsonBody throws INVALID_JSON on malformed JSON", () => {
  assert.throws(
    () => parseJsonBody({ body: "not json" } as HttpEvent),
    (error) => error instanceof AppError && error.code === "INVALID_JSON",
  );
});

test("requireString trims and returns a non-empty string", () => {
  assert.equal(requireString("  hello  ", "name"), "hello");
});

test("requireString rejects non-strings and whitespace-only strings", () => {
  for (const value of [undefined, null, 123, "   ", ""]) {
    assert.throws(
      () => requireString(value, "name"),
      (error) => error instanceof AppError && error.code === "VALIDATION_ERROR",
    );
  }
});
