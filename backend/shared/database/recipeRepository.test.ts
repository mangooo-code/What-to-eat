import assert from "node:assert/strict";
import test from "node:test";
import {
  findMatchingFavoriteRecipeIds,
  getRecipeById,
  getRecipeIngredients,
  getRecipeSeasonings,
  getRecipeSteps,
  getRecipes,
  saveRecipeWithSteps,
  updateRecipeFavorite,
} from "./recipeRepository";

let originalFetch: typeof fetch;

test.beforeEach(() => {
  originalFetch = globalThis.fetch;
  process.env.ENV_ID = "test-env";
  process.env.CLOUDBASE_API_KEY = "test-key";
});

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

const recipeRow = {
  id: "r1",
  userId: "u1",
  name: "番茄炒蛋",
  description: "desc",
  time: "20",
  difficulty: "简单",
  imageFileId: null,
  tags: ["家常"],
  substitutions: [] as string[],
  preferences: null,
  isFavorite: true,
  source: "curated" as const,
  rating: "4.5",
  ratingCount: 2,
  createdDate: "d",
  updatedDate: "d",
};

function mockFetch(body: unknown, status = 200) {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
    calls.push({ url: url.toString(), init });
    return new Response(JSON.stringify(body), { status });
  }) as typeof fetch;
  return calls;
}

test("getRecipeById returns the mapped recipe or null", async () => {
  mockFetch([recipeRow]);
  assert.equal((await getRecipeById("r1"))?.name, "番茄炒蛋");
  mockFetch([]);
  assert.equal(await getRecipeById("missing"), null);
});

test("getRecipes filters by isFavorite when provided", async () => {
  const calls = mockFetch([recipeRow]);
  const recipes = await getRecipes("u1", true);
  assert.equal(recipes.length, 1);
  assert.match(calls[0].url, /userId=eq\.u1/);
  assert.match(calls[0].url, /isFavorite=is\.true/);
});

test("getRecipes returns all of the user's recipes when isFavorite is omitted", async () => {
  const calls = mockFetch([recipeRow]);
  await getRecipes("u1");
  assert.match(calls[0].url, /userId=eq\.u1/);
  assert.doesNotMatch(calls[0].url, /isFavorite=/);
});

test("updateRecipeFavorite updates isFavorite scoped to the owning user", async () => {
  const calls = mockFetch([{ ...recipeRow, isFavorite: false }]);
  const recipe = await updateRecipeFavorite("r1", "u1", false);
  assert.equal(recipe?.isFavorite, false);
  assert.equal(calls[0].init?.method, "PATCH");
  assert.match(calls[0].url, /id=eq\.r1/);
  assert.match(calls[0].url, /userId=eq\.u1/);
  assert.deepEqual(JSON.parse(String(calls[0].init?.body)), { isFavorite: false });
});

test("updateRecipeFavorite returns null when no matching row is updated", async () => {
  mockFetch([]);
  assert.equal(await updateRecipeFavorite("missing", "u1", true), null);
});

test("saveRecipeWithSteps returns the existing recipe without creating a duplicate", async () => {
  const calls = mockFetch([recipeRow]);
  const recipe = await saveRecipeWithSteps(
    "u1",
    { id: "r1", name: "x", description: null, difficulty: null, tags: [], time: null, source: "ai_generated" },
    [],
  );
  assert.equal(recipe.id, "r1");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].init?.method ?? "GET", "GET");
});

test("saveRecipeWithSteps creates a new recipe, its steps, and its seasonings when none exists", async () => {
  const newRecipeRow = { ...recipeRow, id: "r2", name: "新菜谱" };
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  let call = 0;
  globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
    calls.push({ url: url.toString(), init });
    call++;
    if (call === 1) return new Response("[]", { status: 200 }); // getRecipeById: not found
    if (call === 2) return new Response(JSON.stringify([newRecipeRow]), { status: 201 }); // create Recipes row
    return new Response("[]", { status: 201 }); // create RecipeSteps / RecipeSeasonings rows
  }) as typeof fetch;

  const recipe = await saveRecipeWithSteps(
    "u1",
    { id: "r2", name: "新菜谱", description: null, difficulty: null, tags: [], time: 20, source: "ai_generated" },
    [{ title: "备料", detailedInstructions: "洗净切块", time: 5 }],
    [{ name: "盐", quantity: "适量" }],
  );

  assert.equal(recipe.id, "r2");
  assert.equal(calls.length, 4);
  assert.equal(calls[1].init?.method, "POST");
  assert.equal(calls[2].init?.method, "POST");
  assert.equal(calls[3].init?.method, "POST");
  const stepsBody = JSON.parse(String(calls[2].init?.body)) as Array<{ recipeId: string; stepNumber: number }>;
  assert.equal(stepsBody[0].recipeId, "r2");
  assert.equal(stepsBody[0].stepNumber, 1);
  const seasoningsBody = JSON.parse(String(calls[3].init?.body)) as Array<{ recipeId: string; name: string; quantity: string }>;
  assert.equal(seasoningsBody[0].recipeId, "r2");
  assert.equal(seasoningsBody[0].name, "盐");
  assert.equal(seasoningsBody[0].quantity, "适量");
});

test("saveRecipeWithSteps splits ingredient quantities, saves them into ReferenceIngredients, and links RecipeIngredients to the new rows", async () => {
  const newRecipeRow = { ...recipeRow, id: "r3", name: "新菜谱" };
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  let call = 0;
  globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
    calls.push({ url: url.toString(), init });
    call++;
    if (call === 1) return new Response("[]", { status: 200 }); // getRecipeById: not found
    if (call === 2) return new Response(JSON.stringify([newRecipeRow]), { status: 201 }); // create Recipes row
    if (call === 3) return new Response(JSON.stringify([{ id: 1, name: "个" }, { id: 2, name: "克" }]), { status: 200 }); // listUnitTypes
    if (call === 4) return new Response(JSON.stringify([{ id: "ref-1" }, { id: "ref-2" }]), { status: 201 }); // create ReferenceIngredients rows
    return new Response("[]", { status: 201 }); // create RecipeIngredients rows
  }) as typeof fetch;

  const recipe = await saveRecipeWithSteps(
    "u1",
    { id: "r3", name: "新菜谱", description: null, difficulty: null, tags: [], time: 20, source: "ai_generated" },
    [],
    [],
    [
      { name: "牛肉", quantity: "300 克" },
      { name: "神秘食材", quantity: "1 桶" },
    ],
  );

  assert.equal(recipe.id, "r3");
  assert.equal(calls.length, 5);
  assert.equal(calls[3].init?.method, "POST");
  assert.equal(calls[4].init?.method, "POST");

  const referenceBody = JSON.parse(String(calls[3].init?.body)) as Array<{
    name: string;
    quantity: number;
    unitTypeId: number;
    userId: string;
  }>;
  assert.deepEqual(referenceBody, [
    { name: "牛肉", quantity: 300, unitTypeId: 2, userId: "u1" },
    { name: "神秘食材", quantity: 1, unitTypeId: 1, userId: "u1" }, // "桶" has no match -> defaults to unitType 1
  ]);

  const recipeIngredientsBody = JSON.parse(String(calls[4].init?.body)) as Array<{
    recipeId: string;
    ingredientId: string;
    nameSnapshot: string;
    quantity: number;
  }>;
  assert.deepEqual(recipeIngredientsBody, [
    { recipeId: "r3", ingredientId: "ref-1", nameSnapshot: "牛肉", unitTypeId: 2, quantity: 300, isOptional: false },
    { recipeId: "r3", ingredientId: "ref-2", nameSnapshot: "神秘食材", unitTypeId: 1, quantity: 1, isOptional: false },
  ]);
});

test("getRecipeIngredients maps the quantity string to a number", async () => {
  mockFetch([{ id: 1, recipeId: "r1", ingredientId: null, nameSnapshot: "番茄", unitTypeId: 1, quantity: "2", isOptional: false }]);
  const ingredients = await getRecipeIngredients("r1");
  assert.equal(ingredients[0].quantity, 2);
});

test("getRecipeSteps maps rows in step order", async () => {
  mockFetch([{ id: "s1", recipeId: "r1", stepNumber: 1, title: "备料", detailedInstructions: "洗净切块", time: "5", createdAt: "d", updatedAt: "d" }]);
  const steps = await getRecipeSteps("r1");
  assert.equal(steps[0].time, 5);
});

test("getRecipeSeasonings maps rows including a null quantity", async () => {
  mockFetch([
    { id: "se1", recipeId: "r1", name: "盐", quantity: "适量", createdAt: "d", updatedAt: "d" },
    { id: "se2", recipeId: "r1", name: "白糖", quantity: null, createdAt: "d", updatedAt: "d" },
  ]);
  const seasonings = await getRecipeSeasonings("r1");
  assert.equal(seasonings[0].quantity, "适量");
  assert.equal(seasonings[1].quantity, null);
});

test("findMatchingFavoriteRecipeIds returns [] immediately when there are no favorites", async () => {
  let callCount = 0;
  globalThis.fetch = (async () => {
    callCount++;
    return new Response("[]", { status: 200 });
  }) as typeof fetch;
  assert.deepEqual(await findMatchingFavoriteRecipeIds("u1"), []);
  assert.equal(callCount, 1);
});

test("findMatchingFavoriteRecipeIds filters by time range and inventory, sorted by rating desc", async () => {
  const responses = [
    [{ id: "r1", rating: "4.5" }, { id: "r2", rating: null }], // Recipes (userId+isFavorite+time filter)
    [{ recipeId: "r1", nameSnapshot: "番茄" }, { recipeId: "r2", nameSnapshot: "缺货食材" }], // RecipeIngredients
    [{ name: "番茄", normalizedName: null }], // Ingredients (user inventory)
  ];
  let index = 0;
  const calls: string[] = [];
  globalThis.fetch = (async (url: string | URL) => {
    calls.push(url.toString());
    return new Response(JSON.stringify(responses[index++]), { status: 200 });
  }) as typeof fetch;

  const ids = await findMatchingFavoriteRecipeIds("u1", { maxMinutes: 30 });
  assert.deepEqual(ids, ["r1"]);
  assert.match(calls[0], /time=lte\.30/);
  assert.match(calls[0], /isFavorite=is\.true/);
});
