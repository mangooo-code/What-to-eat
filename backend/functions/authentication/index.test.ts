import assert from "node:assert/strict";
import test from "node:test";

import { main } from "./index";

test("rejects non-POST requests", async () => {
  const response = await main({ httpMethod: "GET" });

  assert.equal(response.statusCode, 405);
  assert.equal(response.headers.allow, "POST");
});

test("rejects invalid JSON", async () => {
  const response = await main({ httpMethod: "POST", body: "{" });

  assert.equal(response.statusCode, 400);
  assert.deepEqual(JSON.parse(response.body), { error: "Request body must be valid JSON" });
});

test("requires a phone number and password", async () => {
  const response = await main({ httpMethod: "POST", body: "{}" });

  assert.equal(response.statusCode, 400);
  assert.deepEqual(JSON.parse(response.body), { error: "phoneNumber and password are required" });
});