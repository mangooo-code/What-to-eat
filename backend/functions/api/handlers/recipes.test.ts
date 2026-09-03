import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import test from "node:test";
import { AppError } from "../../../shared/errors/AppError";
import type { HttpEvent } from "../../../shared/types/api";
import { handleRecipes } from "./recipes";

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

const recipeRow = {
  id: "10000000-0000-4000-8000-000000000201",
  userId: "u1",
  name: "AI 推荐菜",
  description: "desc",
  time: "20",
  difficulty: "简单",
  imageFileId: null,
  tags: ["家常"],
  substitutions: [] as string[],
  preferences: null,
  isFavorite: false,
  source: "ai_generated" as const,
  rating: null,
  ratingCount: 0,
  createdDate: "d",
  updatedDate: "d",
};

function baseBody(overrides: Record<string, unknown> = {}) {
  return {
    id: "10000000-0000-4000-8000-000000000201",
    name: "AI 推荐菜",
    description: "desc",
    difficulty: "简单",
    tags: ["家常"],
    cookTime: "20 分钟",
    seasonings: [{ name: "盐", quantity: "适量" }],
    steps: [{ title: "备料", detailedInstructions: "洗净切块", time: 5 }],
    ...overrides,
  };
}

test("rejects unsupported methods", async () => {
  await assert.rejects(
    handleRecipes({ httpMethod: "DELETE", headers: authHeader() } as HttpEvent),
    (error) => error instanceof AppError && error.code === "METHOD_NOT_ALLOWED",
  );
});

test("GET rejects an invalid isFavorite query param", async () => {
  await assert.rejects(
    handleRecipes({ httpMethod: "GET", headers: authHeader(), queryStringParameters: { isFavorite: "yes" } } as HttpEvent),
    (error) => error instanceof AppError && error.code === "VALIDATION_ERROR",
  );
});

test("GET /recipes/counts returns total and favorite tallies", async () => {
  globalThis.fetch = (async (url: string | URL) => {
    const str = url.toString();
    if (/\/Recipes\?/.test(str)) {
      return new Response(
        JSON.stringify([{ isFavorite: true }, { isFavorite: false }, { isFavorite: true }]),
        { status: 200 },
      );
    }
    throw new Error(`Unexpected fetch call: ${str}`);
  }) as typeof fetch;

  const result = await handleRecipes({
    httpMethod: "GET",
    headers: authHeader(),
    path: "/recipes/counts",
  } as HttpEvent);

  assert.equal(result.statusCode, 200);
  const body = JSON.parse(result.body);
  assert.deepEqual(body.data, { totalCount: 3, favoriteCount: 2 });
});

test("GET returns the requesting user's recipes filtered by isFavorite", async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
    const str = url.toString();
    calls.push({ url: str, init });
    if (/\/Recipes\?/.test(str)) return new Response(JSON.stringify([{ ...recipeRow, isFavorite: true }]), { status: 200 });
    if (/\/Ingredients\?/.test(str)) return new Response("[]", { status: 200 });
    if (/\/RecipeIngredients\?/.test(str)) return new Response("[]", { status: 200 });
    throw new Error(`Unexpected fetch call: ${str}`);
  }) as typeof fetch;

  const response = await handleRecipes({
    httpMethod: "GET",
    headers: authHeader(),
    queryStringParameters: { isFavorite: "true" },
  } as HttpEvent);

  assert.equal(response.statusCode, 200);
  const payload = JSON.parse(response.body) as { data: Array<{ id: string; name: string; isFavorite: boolean }> };
  assert.equal(payload.data.length, 1);
  assert.equal(payload.data[0].id, recipeRow.id);
  assert.equal(payload.data[0].isFavorite, true);
  assert.match(calls[0].url, /userId=eq\.u1/);
  assert.match(calls[0].url, /isFavorite=is\.true/);
});

test("GET without isFavorite returns all of the requesting user's recipes", async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
    const str = url.toString();
    calls.push({ url: str, init });
    if (/\/Recipes\?/.test(str)) return new Response(JSON.stringify([recipeRow, { ...recipeRow, id: "r2", isFavorite: true }]), { status: 200 });
    if (/\/Ingredients\?/.test(str)) return new Response("[]", { status: 200 });
    if (/\/RecipeIngredients\?/.test(str)) return new Response("[]", { status: 200 });
    throw new Error(`Unexpected fetch call: ${str}`);
  }) as typeof fetch;

  const response = await handleRecipes({
    httpMethod: "GET",
    headers: authHeader(),
    queryStringParameters: {},
  } as HttpEvent);

  assert.equal(response.statusCode, 200);
  const payload = JSON.parse(response.body) as { data: unknown[] };
  assert.equal(payload.data.length, 2);
  assert.match(calls[0].url, /userId=eq\.u1/);
  assert.doesNotMatch(calls[0].url, /isFavorite=/);
});

test("GET computes matchSummary/hasEnoughIngredients from the user's on-hand inventory", async () => {
  globalThis.fetch = (async (url: string | URL) => {
    const str = url.toString();
    if (/\/Recipes\?/.test(str)) return new Response(JSON.stringify([recipeRow]), { status: 200 });
    if (/\/Ingredients\?/.test(str)) {
      return new Response(
        JSON.stringify([
          { id: "i1", userId: "u1", name: "番茄", normalizedName: "番茄", quantity: "1", unitTypeId: 1, locationId: "l1", expiryDate: null, imageFileId: null, source: "manual", createdDate: "d", updatedDate: "d" },
        ]),
        { status: 200 },
      );
    }
    if (/\/RecipeIngredients\?/.test(str)) {
      return new Response(
        JSON.stringify([
          { id: 1, recipeId: recipeRow.id, ingredientId: null, nameSnapshot: "番茄", unitTypeId: 1, quantity: "2", isOptional: false },
          { id: 2, recipeId: recipeRow.id, ingredientId: null, nameSnapshot: "鸡蛋", unitTypeId: 1, quantity: "3", isOptional: false },
          { id: 3, recipeId: recipeRow.id, ingredientId: null, nameSnapshot: "葱花", unitTypeId: 1, quantity: "1", isOptional: true },
        ]),
        { status: 200 },
      );
    }
    throw new Error(`Unexpected fetch call: ${str}`);
  }) as typeof fetch;

  const response = await handleRecipes({
    httpMethod: "GET",
    headers: authHeader(),
    queryStringParameters: {},
  } as HttpEvent);

  assert.equal(response.statusCode, 200);
  const payload = JSON.parse(response.body) as {
    data: Array<{ matchSummary: string; hasEnoughIngredients: boolean; cookTime: string }>;
  };
  // 番茄: has 1, needs 2 (short); 鸡蛋: has 0, needs 3 (short); 葱花 is optional so it's ignored.
  assert.equal(payload.data[0].hasEnoughIngredients, false);
  assert.equal(payload.data[0].matchSummary, "缺少 2 种主要食材");
  assert.equal(payload.data[0].cookTime, "20 分钟");
});

test("PATCH rejects a non-boolean isFavorite", async () => {
  await assert.rejects(
    handleRecipes({
      httpMethod: "PATCH",
      headers: authHeader(),
      path: `/recipes/${recipeRow.id}`,
      body: JSON.stringify({ isFavorite: "yes" }),
    } as HttpEvent),
    (error) => error instanceof AppError && error.code === "VALIDATION_ERROR",
  );
});

test("PATCH updates isFavorite when the recipe exists and belongs to the user", async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
    calls.push({ url: url.toString(), init });
    return new Response(JSON.stringify([{ ...recipeRow, isFavorite: true }]), { status: 200 });
  }) as typeof fetch;

  const response = await handleRecipes({
    httpMethod: "PATCH",
    headers: authHeader(),
    path: `/recipes/${recipeRow.id}`,
    body: JSON.stringify({ isFavorite: true }),
  } as HttpEvent);

  assert.equal(response.statusCode, 200);
  const payload = JSON.parse(response.body) as { data: { updated: boolean; recipe: { isFavorite: boolean } } };
  assert.equal(payload.data.updated, true);
  assert.equal(payload.data.recipe.isFavorite, true);
  assert.equal(calls[0].init?.method, "PATCH");
  assert.match(calls[0].url, /id=eq\.10000000-0000-4000-8000-000000000201/);
  assert.match(calls[0].url, /userId=eq\.u1/);
  assert.deepEqual(JSON.parse(String(calls[0].init?.body)), { isFavorite: true });
});

test("PATCH reports not updated when the recipe doesn't exist or isn't owned by the user", async () => {
  globalThis.fetch = (async () => new Response("[]", { status: 200 })) as typeof fetch;

  const response = await handleRecipes({
    httpMethod: "PATCH",
    headers: authHeader(),
    path: `/recipes/${recipeRow.id}`,
    body: JSON.stringify({ isFavorite: true }),
  } as HttpEvent);

  assert.equal(response.statusCode, 200);
  const payload = JSON.parse(response.body) as { data: { updated: boolean; recipe: unknown } };
  assert.equal(payload.data.updated, false);
  assert.equal(payload.data.recipe, null);
});

test("GET /recipes/{id} returns the recipe with its ingredients, seasonings, and steps", async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
    const str = url.toString();
    calls.push({ url: str, init });
    if (/\/Recipes\?/.test(str)) return new Response(JSON.stringify([recipeRow]), { status: 200 });
    if (/\/RecipeIngredients\?/.test(str)) {
      return new Response(JSON.stringify([{ id: 1, recipeId: recipeRow.id, ingredientId: null, nameSnapshot: "番茄", unitTypeId: 1, quantity: "2", isOptional: false }]), { status: 200 });
    }
    if (/\/IngredientUnitTypes\?/.test(str)) {
      return new Response(JSON.stringify([{ id: 1, name: "个" }]), { status: 200 });
    }
    if (/\/RecipeSeasonings\?/.test(str)) {
      return new Response(JSON.stringify([{ id: "se1", recipeId: recipeRow.id, name: "盐", quantity: "适量", createdAt: "d", updatedAt: "d" }]), { status: 200 });
    }
    if (/\/RecipeSteps\?/.test(str)) {
      return new Response(JSON.stringify([{ id: "st1", recipeId: recipeRow.id, stepNumber: 1, title: "备料", detailedInstructions: "洗净切块", time: "5", createdAt: "d", updatedAt: "d" }]), { status: 200 });
    }
    throw new Error(`Unexpected fetch call: ${str}`);
  }) as typeof fetch;

  const response = await handleRecipes({
    httpMethod: "GET",
    headers: authHeader(),
    path: `/recipes/${recipeRow.id}`,
  } as HttpEvent);

  assert.equal(response.statusCode, 200);
  const payload = JSON.parse(response.body) as {
    data: { id: string; name: string; cookTime: string; isFavorite: boolean; ingredients: unknown; seasonings: unknown; steps: unknown };
  };
  assert.equal(payload.data.id, recipeRow.id);
  assert.equal(payload.data.name, "AI 推荐菜");
  assert.equal(payload.data.cookTime, "20 分钟");
  assert.equal(payload.data.isFavorite, false);
  assert.deepEqual(payload.data.ingredients, [{ name: "番茄", quantity: 2, unit: "个" }]);
  assert.deepEqual(payload.data.seasonings, [{ name: "盐", quantity: "适量" }]);
  assert.deepEqual(payload.data.steps, [{ title: "备料", detailedInstructions: "洗净切块", time: 5 }]);
});

test("GET /recipes/{id} 404s when the recipe doesn't exist or isn't owned by the user", async () => {
  globalThis.fetch = (async () => new Response("[]", { status: 200 })) as typeof fetch;

  await assert.rejects(
    handleRecipes({
      httpMethod: "GET",
      headers: authHeader(),
      path: `/recipes/${recipeRow.id}`,
    } as HttpEvent),
    (error) => error instanceof AppError && error.code === "RECIPE_NOT_FOUND" && error.statusCode === 404,
  );
});

test("requires authentication", async () => {
  await assert.rejects(
    handleRecipes({ httpMethod: "POST", headers: {}, body: JSON.stringify(baseBody()) } as HttpEvent),
    (error) => error instanceof AppError && error.code === "UNAUTHORIZED",
  );
});

test("rejects a non-uuid id", async () => {
  await assert.rejects(
    handleRecipes({
      httpMethod: "POST",
      headers: authHeader(),
      body: JSON.stringify(baseBody({ id: "not-a-uuid" })),
    } as HttpEvent),
    (error) => error instanceof AppError && error.code === "VALIDATION_ERROR",
  );
});

test("saves a new recipe with its steps and seasonings, and returns it", async () => {
  let call = 0;
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
    calls.push({ url: url.toString(), init });
    call++;
    if (call === 1) return new Response("[]", { status: 200 });
    if (call === 2) return new Response(JSON.stringify([recipeRow]), { status: 201 });
    return new Response("[]", { status: 201 });
  }) as typeof fetch;

  const response = await handleRecipes({
    httpMethod: "POST",
    headers: authHeader(),
    body: JSON.stringify(baseBody()),
  } as HttpEvent);

  assert.equal(response.statusCode, 201);
  const payload = JSON.parse(response.body) as { success: boolean; data: { id: string } };
  assert.equal(payload.success, true);
  assert.equal(payload.data.id, recipeRow.id);

  const createBody = JSON.parse(String(calls[1].init?.body)) as { time: number | null };
  assert.equal(createBody.time, 20);

  const seasoningsBody = JSON.parse(String(calls[3].init?.body)) as Array<{
    recipeId: string;
    name: string;
    quantity: string | null;
  }>;
  assert.equal(seasoningsBody[0].recipeId, recipeRow.id);
  assert.equal(seasoningsBody[0].name, "盐");
  assert.equal(seasoningsBody[0].quantity, "适量");
});

test("returns the existing recipe without duplicating it", async () => {
  globalThis.fetch = (async () => new Response(JSON.stringify([recipeRow]), { status: 200 })) as typeof fetch;
  const response = await handleRecipes({
    httpMethod: "POST",
    headers: authHeader(),
    body: JSON.stringify(baseBody()),
  } as HttpEvent);
  const payload = JSON.parse(response.body) as { data: { id: string } };
  assert.equal(payload.data.id, recipeRow.id);
});
