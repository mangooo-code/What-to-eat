import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import test from "node:test";
import { AppError } from "../../../shared/errors/AppError";
import type { HttpEvent } from "../../../shared/types/api";
import { handleIngredients } from "./ingredients";

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

test("requires authentication", async () => {
  await assert.rejects(
    handleIngredients({ httpMethod: "GET", path: "/ingredients/units", headers: {} } as HttpEvent),
    (error) => error instanceof AppError && error.code === "UNAUTHORIZED",
  );
});

test("GET /ingredients/units returns the configured unit types", async () => {
  globalThis.fetch = (async () =>
    new Response(JSON.stringify([{ id: 1, name: "个" }]), { status: 200 })) as typeof fetch;
  const response = await handleIngredients({
    httpMethod: "GET",
    path: "/ingredients/units",
    headers: authHeader(),
  } as HttpEvent);
  assert.deepEqual(JSON.parse(response.body), { success: true, data: [{ id: 1, name: "个" }] });
});

test("rejects unsupported paths/methods", async () => {
  await assert.rejects(
    handleIngredients({ httpMethod: "POST", path: "/ingredients/units", headers: authHeader() } as HttpEvent),
    (error) => error instanceof AppError && error.code === "METHOD_NOT_ALLOWED",
  );
  await assert.rejects(
    handleIngredients({ httpMethod: "GET", path: "/ingredients/other", headers: authHeader() } as HttpEvent),
    (error) => error instanceof AppError && error.code === "METHOD_NOT_ALLOWED",
  );
});
