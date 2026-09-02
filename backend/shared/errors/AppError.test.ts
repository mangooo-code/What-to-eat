import assert from "node:assert/strict";
import test from "node:test";
import { AppError } from "./AppError";

test("defaults statusCode to 400 and sets name/code/message", () => {
  const error = new AppError("SOME_CODE", "Something went wrong");
  assert.equal(error.code, "SOME_CODE");
  assert.equal(error.message, "Something went wrong");
  assert.equal(error.statusCode, 400);
  assert.equal(error.name, "AppError");
  assert.ok(error instanceof Error);
});

test("accepts a custom statusCode", () => {
  const error = new AppError("NOT_FOUND", "missing", 404);
  assert.equal(error.statusCode, 404);
});
