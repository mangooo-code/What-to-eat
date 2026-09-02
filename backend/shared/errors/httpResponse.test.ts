import assert from "node:assert/strict";
import test from "node:test";
import { AppError } from "./AppError";
import { corsPreflightResponse, errorResponse, successResponse } from "./httpResponse";

test("corsPreflightResponse returns 204 with no body", () => {
  const response = corsPreflightResponse();
  assert.equal(response.statusCode, 204);
  assert.equal(response.body, "");
  assert.equal(response.headers["access-control-allow-origin"], "*");
});

test("successResponse wraps data with success:true and defaults to 200", () => {
  const response = successResponse({ id: 1 });
  assert.equal(response.statusCode, 200);
  assert.deepEqual(JSON.parse(response.body), { success: true, data: { id: 1 } });
});

test("successResponse accepts a custom statusCode", () => {
  const response = successResponse(null, 201);
  assert.equal(response.statusCode, 201);
});

test("errorResponse formats an AppError using its code/message/statusCode", () => {
  const response = errorResponse(new AppError("NOT_FOUND", "missing", 404));
  assert.equal(response.statusCode, 404);
  assert.deepEqual(JSON.parse(response.body), {
    success: false,
    error: { code: "NOT_FOUND", message: "missing" },
  });
});

test("errorResponse wraps unknown errors as a 500 INTERNAL_ERROR", () => {
  const response = errorResponse(new Error("boom"));
  assert.equal(response.statusCode, 500);
  assert.deepEqual(JSON.parse(response.body), {
    success: false,
    error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
  });
});

test("errorResponse wraps non-Error throws the same way", () => {
  const response = errorResponse("plain string throw");
  assert.equal(response.statusCode, 500);
});
