import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import test from "node:test";
import { AppError } from "../../../shared/errors/AppError";
import type { HttpEvent } from "../../../shared/types/api";
import { handleFindRecipes } from "./findRecipes";

let originalFetch: typeof fetch;

test.beforeEach(() => {
  originalFetch = globalThis.fetch;
  process.env.ENV_ID = "test-env";
  process.env.CLOUDBASE_API_KEY = "test-key";
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

function baseBody(overrides: Record<string, unknown> = {}) {
  return { timePreference: "快速解决（15–30 分钟）", tastePreference: "家常下饭", ...overrides };
}

test("rejects unsupported methods", async () => {
  await assert.rejects(
    handleFindRecipes({ httpMethod: "GET", headers: authHeader() } as HttpEvent),
    (error) => error instanceof AppError && error.code === "METHOD_NOT_ALLOWED",
  );
});

test("requires authentication", async () => {
  await assert.rejects(
    handleFindRecipes({ httpMethod: "POST", headers: {}, body: JSON.stringify(baseBody()) } as HttpEvent),
    (error) => error instanceof AppError && error.code === "UNAUTHORIZED",
  );
});

test("rejects malformed memberIds", async () => {
  await assert.rejects(
    handleFindRecipes({
      httpMethod: "POST",
      headers: authHeader(),
      body: JSON.stringify(baseBody({ memberIds: ["not-a-uuid"] })),
    } as HttpEvent),
    (error) => error instanceof AppError && error.code === "VALIDATION_ERROR",
  );
});

test("rejects memberIds that don't belong to the requesting user", async () => {
  globalThis.fetch = (async () => new Response("[]", { status: 200 })) as typeof fetch;
  await assert.rejects(
    handleFindRecipes({
      httpMethod: "POST",
      headers: authHeader(),
      body: JSON.stringify(baseBody({ memberIds: ["11111111-1111-4111-8111-111111111111"] })),
    } as HttpEvent),
    (error) => error instanceof AppError && error.code === "VALIDATION_ERROR",
  );
});

test("returns generated recipes for a valid submission", async () => {
  const aiRecipe = {
    name: "AI 推荐菜",
    description: "desc",
    difficulty: "简单",
    time: 20,
    tags: ["家常"],
    ingredients: [{ name: "番茄", quantity: "2 个" }],
    seasonings: [{ name: "盐", quantity: "适量" }],
    steps: [{ title: "备料", detailedInstructions: "洗净切块", time: 5 }],
  };
  const aiBody = { output: { choices: [{ message: { content: [{ text: JSON.stringify([aiRecipe]) }] } }] } };
  globalThis.fetch = (async (url: string | URL) => {
    const str = url.toString();
    if (/\/v1\/rdb\/rest\/Ingredients\?/.test(str)) return new Response(JSON.stringify([{ id: "i1" }]), { status: 200 });
    if (/\/services\/aigc\//.test(str)) return new Response(JSON.stringify(aiBody), { status: 200 });
    throw new Error(`Unexpected fetch call: ${str}`);
  }) as typeof fetch;

  const response = await handleFindRecipes({
    httpMethod: "POST",
    headers: authHeader(),
    body: JSON.stringify(baseBody()),
  } as HttpEvent);
  const payload = JSON.parse(response.body) as { success: boolean; data: Array<{ name: string }> };
  assert.equal(payload.success, true);
  assert.equal(payload.data.length, 3);
  assert.equal(payload.data[0].name, "AI 推荐菜");
});

test("rejects submission when the user's fridge has no ingredients", async () => {
  globalThis.fetch = (async () => new Response("[]", { status: 200 })) as typeof fetch;
  await assert.rejects(
    handleFindRecipes({
      httpMethod: "POST",
      headers: authHeader(),
      body: JSON.stringify(baseBody()),
    } as HttpEvent),
    (error) => error instanceof AppError && error.code === "EMPTY_FRIDGE" && error.statusCode === 400,
  );
});

