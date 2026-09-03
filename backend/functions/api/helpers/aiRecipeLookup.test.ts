import assert from "node:assert/strict";
import test from "node:test";
import { search, type FindRecipesSubmission } from "./aiRecipeLookup";

let originalFetch: typeof fetch;

test.beforeEach(() => {
  originalFetch = globalThis.fetch;
  process.env.ENV_ID = "test-env";
  process.env.CLOUDBASE_API_KEY = "test-key";
  process.env.ALIYUN_API_KEY = "test-key";
  process.env.ALIYUN_BASE_URL = "https://fake-aliyun.test";
});

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

function aiRecipeBody(name: string) {
  const recipe = {
    name,
    description: "desc",
    difficulty: "简单",
    time: 20,
    tags: ["家常"],
    ingredients: [{ name: "番茄", quantity: "2 个" }],
    seasonings: [{ name: "盐", quantity: "适量" }],
    steps: [{ title: "备料", detailedInstructions: "洗净切块", time: 5 }],
  };
  return { output: { choices: [{ message: { content: [{ text: JSON.stringify([recipe]) }] } }] } };
}

function baseSubmission(overrides: Partial<FindRecipesSubmission> = {}): FindRecipesSubmission {
  return {
    userId: "u1",
    timePreference: "快速解决（15–30 分钟）",
    memberIds: [],
    tastePreference: "家常下饭",
    preferLikedRecipes: false,
    dietaryExclusions: [],
    ...overrides,
  };
}

function mockFetchByUrl(handlers: Array<{ match: RegExp; body: unknown }>) {
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
    const str = url.toString();
    requests.push({ url: str, init });
    const handler = handlers.find((candidate) => candidate.match.test(str));
    if (!handler) throw new Error(`Unexpected fetch call: ${str}`);
    return new Response(JSON.stringify(handler.body), { status: 200 });
  }) as typeof fetch;
  return requests;
}

test("generates AI recipes to fill all result slots when favorites aren't requested", async () => {
  mockFetchByUrl([
    { match: /\/v1\/rdb\/rest\/Ingredients\?/, body: [] },
    { match: /\/services\/aigc\//, body: aiRecipeBody("AI 推荐菜") },
  ]);

  const recipes = await search(baseSubmission());
  assert.equal(recipes.length, 3);
  assert.ok(recipes.every((recipe) => recipe.matchSummary === "AI 推荐 · 根据现有食材生成"));
  assert.ok(recipes.every((recipe) => recipe.isFavorite === false));
  assert.deepEqual(recipes[0].ingredients, [{ name: "番茄", quantity: "2 个" }]);
  assert.deepEqual(recipes[0].steps, [{ title: "备料", detailedInstructions: "洗净切块", time: 5 }]);
});

test("tops up remaining slots with AI recipes after favorites are found", async () => {
  const recipeRow = {
    id: "r1",
    userId: "u1",
    name: "收藏菜",
    description: "desc",
    time: "25",
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
  mockFetchByUrl([
    { match: /\/v1\/rdb\/rest\/Recipes\?/, body: [recipeRow] },
    { match: /\/v1\/rdb\/rest\/RecipeIngredients\?/, body: [] },
    { match: /\/v1\/rdb\/rest\/RecipeSeasonings\?/, body: [{ id: "se1", recipeId: "r1", name: "盐", quantity: "适量", createdAt: "d", updatedAt: "d" }] },
    { match: /\/v1\/rdb\/rest\/RecipeSteps\?/, body: [{ id: "st1", recipeId: "r1", stepNumber: 1, title: "备料", detailedInstructions: "洗净切块", time: 5, createdAt: "d", updatedAt: "d" }] },
    { match: /\/v1\/rdb\/rest\/Ingredients\?/, body: [] },
    { match: /\/services\/aigc\//, body: aiRecipeBody("AI 推荐菜") },
  ]);

  const recipes = await search(baseSubmission({ preferLikedRecipes: true }));
  assert.equal(recipes.length, 3);
  assert.equal(recipes[0].name, "收藏菜");
  assert.equal(recipes[0].matchSummary, "已收藏 · 现有食材可以直接做");
  assert.equal(recipes[0].isFavorite, true);
  assert.deepEqual(recipes[0].seasonings, [{ name: "盐", quantity: "适量" }]);
  assert.deepEqual(recipes[0].steps, [{ title: "备料", detailedInstructions: "洗净切块", time: 5 }]);
  assert.ok(recipes.slice(1).every((recipe) => recipe.matchSummary === "AI 推荐 · 根据现有食材生成"));
  assert.ok(recipes.slice(1).every((recipe) => recipe.isFavorite === false));
});

test("keeps successful AI recipes when some parallel AI calls fail", async () => {
  let aiCallCount = 0;
  globalThis.fetch = (async (url: string | URL) => {
    const str = url.toString();
    if (/\/v1\/rdb\/rest\/Ingredients\?/.test(str)) return new Response("[]", { status: 200 });
    if (/\/services\/aigc\//.test(str)) {
      aiCallCount++;
      if (aiCallCount === 1) return new Response("server error", { status: 500 });
      return new Response(JSON.stringify(aiRecipeBody("AI 推荐菜")), { status: 200 });
    }
    throw new Error(`Unexpected fetch call: ${str}`);
  }) as typeof fetch;

  const recipes = await search(baseSubmission());
  assert.equal(recipes.length, 2);
});

test("includes member dietary exclusions and allergens in the AI prompt", async () => {
  const requests = mockFetchByUrl([
    {
      match: /\/v1\/rdb\/rest\/HouseholdMembers\?/,
      body: [
        {
          id: "m1",
          ownerUserId: "u1",
          name: "孩子",
          relationship: "child",
          isOwner: false,
          tastePreference: null,
          dietPreference: null,
          dietaryRestrictions: ["不吃辣"],
          allergens: ["花生"],
          createdDate: "d",
          updatedDate: "d",
        },
      ],
    },
    { match: /\/v1\/rdb\/rest\/Ingredients\?/, body: [] },
    { match: /\/services\/aigc\//, body: aiRecipeBody("AI 推荐菜") },
  ]);

  await search(baseSubmission({ memberIds: ["m1"], dietaryExclusions: ["不吃香菜"] }));

  const aiRequest = requests.find((request) => /\/services\/aigc\//.test(request.url));
  const payload = JSON.parse(String(aiRequest?.init?.body)) as {
    input: { messages: Array<{ content: Array<{ text?: string }> }> };
  };
  const prompt = payload.input.messages[1]?.content[0]?.text ?? "";
  assert.match(prompt, /本人忌口：不吃香菜/);
  assert.match(prompt, /同桌家庭成员忌口：不吃辣/);
  assert.match(prompt, /过敏源（必须避免）：花生/);
});
