import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import test from "node:test";
import { AppError } from "../../../shared/errors/AppError";
import type { HttpEvent } from "../../../shared/types/api";
import { handleInventory } from "./inventory";

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

function mockFetchByResource(bodies: Record<string, unknown>) {
  globalThis.fetch = (async (url: string | URL) => {
    const str = url.toString();
    const entry = Object.entries(bodies).find(([resource]) => str.includes(`/v1/rdb/rest/${resource}?`));
    if (!entry) throw new Error(`Unexpected fetch call: ${str}`);
    return new Response(JSON.stringify(entry[1]), { status: 200 });
  }) as typeof fetch;
}

const ingredientRow = {
  id: "i1",
  userId: "u1",
  name: "番茄",
  normalizedName: null,
  quantity: "2",
  unitTypeId: 1,
  locationId: "loc1",
  expiryDate: null,
  imageFileId: null,
  source: "manual",
  createdDate: "d",
  updatedDate: "d",
};

test("requires authentication", async () => {
  await assert.rejects(
    handleInventory({ httpMethod: "GET", headers: {} } as HttpEvent),
    (error) => error instanceof AppError && error.code === "UNAUTHORIZED",
  );
});

test("GET returns items, locations, and unit types together", async () => {
  mockFetchByResource({
    Ingredients: [ingredientRow],
    Locations: [{ id: "loc1", key: "fridge", name: "冰箱" }],
    IngredientUnitTypes: [{ id: 1, name: "个" }],
  });
  const response = await handleInventory({ httpMethod: "GET", headers: authHeader() } as HttpEvent);
  const payload = JSON.parse(response.body) as { data: { items: Array<{ quantity: number }> } };
  assert.equal(payload.data.items[0].quantity, 2);
});

test("POST rejects a location that doesn't belong to the user", async () => {
  mockFetchByResource({ Locations: [] });
  await assert.rejects(
    handleInventory({
      httpMethod: "POST",
      headers: authHeader(),
      body: JSON.stringify({
        name: "番茄",
        quantity: 2,
        unitTypeId: 1,
        locationId: "11111111-1111-4111-8111-111111111111",
      }),
    } as HttpEvent),
    (error) => error instanceof AppError && error.code === "LOCATION_NOT_FOUND" && error.statusCode === 404,
  );
});

test("POST creates an ingredient when the location is valid", async () => {
  mockFetchByResource({ Locations: [{ id: "loc1" }], Ingredients: [ingredientRow] });
  const response = await handleInventory({
    httpMethod: "POST",
    headers: authHeader(),
    body: JSON.stringify({
      name: "番茄",
      quantity: 2,
      unitTypeId: 1,
      locationId: "11111111-1111-4111-8111-111111111111",
    }),
  } as HttpEvent);
  assert.equal(response.statusCode, 201);
});

test("POST validates quantity", async () => {
  mockFetchByResource({ Locations: [{ id: "loc1" }] });
  await assert.rejects(
    handleInventory({
      httpMethod: "POST",
      headers: authHeader(),
      body: JSON.stringify({
        name: "番茄",
        quantity: -1,
        unitTypeId: 1,
        locationId: "11111111-1111-4111-8111-111111111111",
      }),
    } as HttpEvent),
    (error) => error instanceof AppError && error.code === "VALIDATION_ERROR",
  );
});

test("PATCH with a malformed id throws INGREDIENT_NOT_FOUND", async () => {
  await assert.rejects(
    handleInventory({
      httpMethod: "PATCH",
      headers: authHeader(),
      path: "/inventory/not-a-uuid",
      body: JSON.stringify({ quantity: 3 }),
    } as HttpEvent),
    (error) => error instanceof AppError && error.code === "INGREDIENT_NOT_FOUND" && error.statusCode === 404,
  );
});

test("PATCH updates an ingredient", async () => {
  mockFetchByResource({ Ingredients: [ingredientRow] });
  const response = await handleInventory({
    httpMethod: "PATCH",
    headers: authHeader(),
    path: "/inventory/11111111-1111-4111-8111-111111111111",
    body: JSON.stringify({ quantity: 3 }),
  } as HttpEvent);
  assert.equal(response.statusCode, 200);
});

test("DELETE returns INGREDIENT_NOT_FOUND when nothing was deleted", async () => {
  mockFetchByResource({ Ingredients: [] });
  await assert.rejects(
    handleInventory({
      httpMethod: "DELETE",
      headers: authHeader(),
      path: "/inventory/11111111-1111-4111-8111-111111111111",
    } as HttpEvent),
    (error) => error instanceof AppError && error.code === "INGREDIENT_NOT_FOUND",
  );
});

test("rejects unsupported method/path combinations", async () => {
  await assert.rejects(
    handleInventory({
      httpMethod: "POST",
      headers: authHeader(),
      path: "/inventory/11111111-1111-4111-8111-111111111111",
    } as HttpEvent),
    (error) => error instanceof AppError && error.code === "METHOD_NOT_ALLOWED",
  );
});
