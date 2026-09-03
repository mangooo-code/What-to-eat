import assert from "node:assert/strict";
import test from "node:test";
import type { HttpEvent } from "../../shared/types/api";
import { main } from "./index";

test.beforeEach(() => {
  process.env.ENV_ID = "test-env";
  process.env.CLOUDBASE_API_KEY = "test-key";
  process.env.JWT_SECRET = "test-secret";
});

test("OPTIONS returns a CORS preflight response without reaching any handler", async () => {
  const response = await main({ httpMethod: "OPTIONS" } as HttpEvent);
  assert.equal(response.statusCode, 204);
  assert.equal(response.body, "");
  assert.equal(response.headers?.["access-control-allow-origin"], "*");
});

test("returns 404 ROUTE_NOT_FOUND for a path that matches no known route", async () => {
  const response = await main({ httpMethod: "GET", path: "/nope", headers: {} } as HttpEvent);
  assert.equal(response.statusCode, 404);
  const payload = JSON.parse(response.body) as { success: boolean; error: { code: string } };
  assert.equal(payload.success, false);
  assert.equal(payload.error.code, "ROUTE_NOT_FOUND");
});

test("routes POST to a path ending in /login to handleLogin", async () => {
  const response = await main({ httpMethod: "POST", path: "/api/login", headers: {} } as HttpEvent);
  // No body was sent, so handleLogin's parseJsonBody rejects it - proves this request actually
  // reached handleLogin (a different handler would 401 first, since none of the others accept
  // an unauthenticated request this far).
  assert.equal(response.statusCode, 400);
  const payload = JSON.parse(response.body) as { error: { code: string } };
  assert.equal(payload.error.code, "INVALID_REQUEST");
});

test("GET to a path ending in /login does not match the login route (POST-only) and 404s", async () => {
  const response = await main({ httpMethod: "GET", path: "/api/login", headers: {} } as HttpEvent);
  assert.equal(response.statusCode, 404);
});

const authRequiredRoutes: Array<{ name: string; event: HttpEvent }> = [
  { name: "/inventory", event: { httpMethod: "GET", path: "/inventory", headers: {} } as HttpEvent },
  { name: "/members", event: { httpMethod: "GET", path: "/members", headers: {} } as HttpEvent },
  { name: "/user", event: { httpMethod: "GET", path: "/user", headers: {} } as HttpEvent },
  { name: "/findrecipes", event: { httpMethod: "POST", path: "/findrecipes", headers: {} } as HttpEvent },
  { name: "/recipes", event: { httpMethod: "GET", path: "/recipes", headers: {} } as HttpEvent },
  { name: "/recognize/ingredients", event: { httpMethod: "POST", path: "/recognize/ingredients", headers: {} } as HttpEvent },
  { name: "/ingredients/units", event: { httpMethod: "GET", path: "/ingredients/units", headers: {} } as HttpEvent },
];

for (const { name, event } of authRequiredRoutes) {
  test(`routes ${name} to its handler (proven by an UNAUTHORIZED response with no Authorization header)`, async () => {
    const response = await main(event);
    assert.equal(response.statusCode, 401);
    const payload = JSON.parse(response.body) as { error: { code: string } };
    assert.equal(payload.error.code, "UNAUTHORIZED");
  });
}
