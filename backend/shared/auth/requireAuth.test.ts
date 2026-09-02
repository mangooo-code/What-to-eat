import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import test from "node:test";
import { AppError } from "../errors/AppError";
import type { HttpEvent } from "../types/api";
import { getJwtSecret } from "./jwt";
import { requireAuth } from "./requireAuth";

const ORIGINAL_SECRET = process.env.JWT_SECRET;

test.afterEach(() => {
  if (ORIGINAL_SECRET === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = ORIGINAL_SECRET;
});

test("getJwtSecret throws when JWT_SECRET is not configured", () => {
  delete process.env.JWT_SECRET;
  assert.throws(
    () => getJwtSecret(),
    (error) => error instanceof AppError && error.code === "JWT_SECRET_NOT_CONFIGURED",
  );
});

test("getJwtSecret trims and returns the configured secret", () => {
  process.env.JWT_SECRET = "  test-secret  ";
  assert.equal(getJwtSecret(), "test-secret");
});

test("requireAuth throws UNAUTHORIZED when the Authorization header is missing", () => {
  process.env.JWT_SECRET = "test-secret";
  assert.throws(
    () => requireAuth({ headers: {} } as HttpEvent),
    (error) => error instanceof AppError && error.code === "UNAUTHORIZED" && error.statusCode === 401,
  );
});

test("requireAuth throws UNAUTHORIZED when the header lacks a Bearer prefix", () => {
  process.env.JWT_SECRET = "test-secret";
  assert.throws(
    () => requireAuth({ headers: { authorization: "Token abc" } } as HttpEvent),
    (error) => error instanceof AppError && error.code === "UNAUTHORIZED",
  );
});

test("requireAuth throws UNAUTHORIZED for an invalid token", () => {
  process.env.JWT_SECRET = "test-secret";
  assert.throws(
    () => requireAuth({ headers: { authorization: "Bearer not-a-real-token" } } as HttpEvent),
    (error) => error instanceof AppError && error.code === "UNAUTHORIZED",
  );
});

test("requireAuth throws UNAUTHORIZED when the payload has no string sub", () => {
  process.env.JWT_SECRET = "test-secret";
  const token = jwt.sign({}, "test-secret");
  assert.throws(
    () => requireAuth({ headers: { authorization: `Bearer ${token}` } } as HttpEvent),
    (error) => error instanceof AppError && error.code === "UNAUTHORIZED",
  );
});

test("requireAuth propagates JWT_SECRET_NOT_CONFIGURED when the secret is missing", () => {
  delete process.env.JWT_SECRET;
  assert.throws(
    () => requireAuth({ headers: { authorization: "Bearer whatever" } } as HttpEvent),
    (error) => error instanceof AppError && error.code === "JWT_SECRET_NOT_CONFIGURED" && error.statusCode === 500,
  );
});

test("requireAuth returns the token's sub claim for a valid token", () => {
  process.env.JWT_SECRET = "test-secret";
  const token = jwt.sign({ sub: "user-123" }, "test-secret");
  assert.equal(requireAuth({ headers: { authorization: `Bearer ${token}` } } as HttpEvent), "user-123");
});

test("requireAuth also reads a capitalized Authorization header", () => {
  process.env.JWT_SECRET = "test-secret";
  const token = jwt.sign({ sub: "user-456" }, "test-secret");
  assert.equal(requireAuth({ headers: { Authorization: `Bearer ${token}` } } as HttpEvent), "user-456");
});
