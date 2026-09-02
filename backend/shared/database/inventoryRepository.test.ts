import assert from "node:assert/strict";
import test from "node:test";
import {
  createIngredient,
  deleteIngredient,
  hasAnyIngredients,
  listIngredients,
  listLocations,
  listUnitTypes,
  locationBelongsToUser,
  updateIngredient,
} from "./inventoryRepository";

let originalFetch: typeof fetch;

test.beforeEach(() => {
  originalFetch = globalThis.fetch;
  process.env.ENV_ID = "test-env";
  process.env.CLOUDBASE_API_KEY = "test-key";
});

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

const row = {
  id: "i1",
  userId: "u1",
  name: "番茄",
  normalizedName: null,
  quantity: "2.5",
  unitTypeId: 1,
  locationId: "loc1",
  expiryDate: null,
  imageFileId: null,
  source: "manual" as const,
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

test("listIngredients maps the quantity string to a number", async () => {
  mockFetch([row]);
  const ingredients = await listIngredients("u1");
  assert.equal(ingredients[0].quantity, 2.5);
  assert.equal(ingredients[0].ownerUserId, "u1");
});

test("hasAnyIngredients reports true/false based on the returned rows", async () => {
  mockFetch([{ id: "i1" }]);
  assert.equal(await hasAnyIngredients("u1"), true);
  mockFetch([]);
  assert.equal(await hasAnyIngredients("u1"), false);
});

test("listLocations filters to fridge/freezer/pantry keys", async () => {
  const calls = mockFetch([{ id: "loc1", key: "fridge", name: "冰箱" }]);
  await listLocations("u1");
  assert.match(decodeURIComponent(calls[0].url), /key=in\.\(fridge,freezer,pantry\)/);
});

test("listUnitTypes returns the configured unit types", async () => {
  mockFetch([{ id: 1, name: "个" }]);
  assert.deepEqual(await listUnitTypes(), [{ id: 1, name: "个" }]);
});

test("locationBelongsToUser reports presence based on the returned rows", async () => {
  mockFetch([{ id: "loc1" }]);
  assert.equal(await locationBelongsToUser("loc1", "u1"), true);
  mockFetch([]);
  assert.equal(await locationBelongsToUser("loc1", "u1"), false);
});

test("createIngredient posts the input and returns the mapped record", async () => {
  const calls = mockFetch([row]);
  const ingredient = await createIngredient("u1", {
    name: "番茄",
    normalizedName: null,
    quantity: 2.5,
    unitTypeId: 1,
    locationId: "loc1",
    expiryDate: null,
    imageFileId: null,
    source: "manual",
  });
  assert.equal(ingredient.id, "i1");
  assert.equal(calls[0].init?.method, "POST");
});

test("updateIngredient with no changed fields re-fetches the current row", async () => {
  mockFetch([row]);
  const ingredient = await updateIngredient("i1", "u1", {});
  assert.equal(ingredient?.id, "i1");
});

test("updateIngredient returns null when nothing matched", async () => {
  mockFetch([]);
  assert.equal(await updateIngredient("i1", "u1", { quantity: 3 }), null);
});

test("deleteIngredient reports whether a row was deleted", async () => {
  mockFetch([{ id: "i1" }]);
  assert.equal(await deleteIngredient("i1", "u1"), true);
  mockFetch([]);
  assert.equal(await deleteIngredient("i1", "u1"), false);
});
