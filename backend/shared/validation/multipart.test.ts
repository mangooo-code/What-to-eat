import assert from "node:assert/strict";
import test from "node:test";
import { AppError } from "../errors/AppError";
import type { HttpEvent } from "../types/api";
import { parseMultipartFiles } from "./multipart";

interface Part {
  name: string;
  content: string;
  filename?: string;
  mimeType?: string;
}

function multipartBody(boundary: string, parts: Part[]): string {
  const segments = parts.map((part) => {
    const disposition = part.filename !== undefined
      ? `Content-Disposition: form-data; name="${part.name}"; filename="${part.filename}"`
      : `Content-Disposition: form-data; name="${part.name}"`;
    const lines = [`--${boundary}`, disposition];
    if (part.mimeType) lines.push(`Content-Type: ${part.mimeType}`);
    lines.push("", part.content);
    return lines.join("\r\n");
  });
  return [...segments, `--${boundary}--`, ""].join("\r\n");
}

function multipartEvent(parts: Part[], overrides: Partial<HttpEvent> = {}): HttpEvent {
  const boundary = "TESTBOUNDARY";
  return {
    headers: { "content-type": `multipart/form-data; boundary=${boundary}` },
    body: multipartBody(boundary, parts),
    ...overrides,
  };
}

test("throws INVALID_MULTIPART when content-type is not multipart/form-data", () => {
  assert.throws(
    () => parseMultipartFiles({ headers: { "content-type": "application/json" }, body: "{}" }),
    (error) => error instanceof AppError && error.code === "INVALID_MULTIPART",
  );
});

test("throws INVALID_MULTIPART when the body is missing", () => {
  assert.throws(
    () => parseMultipartFiles({ headers: { "content-type": "multipart/form-data; boundary=X" } }),
    (error) => error instanceof AppError && error.code === "INVALID_MULTIPART",
  );
});

test("throws INVALID_MULTIPART when the boundary delimiter isn't found in the body", () => {
  assert.throws(
    () =>
      parseMultipartFiles({
        headers: { "content-type": "multipart/form-data; boundary=X" },
        body: "not actually multipart content",
      }),
    (error) => error instanceof AppError && error.code === "INVALID_MULTIPART",
  );
});

test("accepts a quoted boundary value", () => {
  const event: HttpEvent = {
    headers: { "content-type": 'multipart/form-data; boundary="TESTBOUNDARY"' },
    body: multipartBody("TESTBOUNDARY", [{ name: "image", filename: "a.jpg", mimeType: "image/jpeg", content: "bytes" }]),
  };
  const files = parseMultipartFiles(event);
  assert.equal(files.length, 1);
});

test("parses a single file field's name/filename/mimeType/content", () => {
  const files = parseMultipartFiles(
    multipartEvent([{ name: "image", filename: "photo.jpg", mimeType: "image/jpeg", content: "fake-bytes" }]),
  );
  assert.equal(files.length, 1);
  assert.equal(files[0].fieldName, "image");
  assert.equal(files[0].filename, "photo.jpg");
  assert.equal(files[0].mimeType, "image/jpeg");
  assert.equal(files[0].content.toString(), "fake-bytes");
  assert.equal(files[0].size, Buffer.byteLength("fake-bytes"));
});

test("parses multiple file fields", () => {
  const files = parseMultipartFiles(
    multipartEvent([
      { name: "image", filename: "a.jpg", mimeType: "image/jpeg", content: "aaa" },
      { name: "thumbnail", filename: "b.png", mimeType: "image/png", content: "bb" },
    ]),
  );
  assert.equal(files.length, 2);
  assert.deepEqual(files.map((f) => f.fieldName), ["image", "thumbnail"]);
});

test("ignores form fields with no filename (not a file part)", () => {
  const files = parseMultipartFiles(
    multipartEvent([
      { name: "note", content: "just text, no filename" },
      { name: "image", filename: "a.jpg", mimeType: "image/jpeg", content: "aaa" },
    ]),
  );
  assert.equal(files.length, 1);
  assert.equal(files[0].fieldName, "image");
});

test("decodes a base64-encoded body", () => {
  const boundary = "TESTBOUNDARY";
  const raw = multipartBody(boundary, [{ name: "image", filename: "a.jpg", mimeType: "image/jpeg", content: "aaa" }]);
  const files = parseMultipartFiles({
    headers: { "content-type": `multipart/form-data; boundary=${boundary}` },
    body: Buffer.from(raw, "latin1").toString("base64"),
    isBase64Encoded: true,
  });
  assert.equal(files.length, 1);
  assert.equal(files[0].content.toString(), "aaa");
});
