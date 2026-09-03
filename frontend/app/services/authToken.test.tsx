import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { authToken } from "./authToken";

// Builds a fake "JWT" with a base64-encoded payload (decodeExpiryMs only ever looks at the
// second dot-separated segment) - header/signature content don't matter to this module.
function makeToken(claims: Record<string, unknown>): string {
  const payload = Buffer.from(JSON.stringify(claims), "utf8").toString("base64");
  return `header.${payload}.signature`;
}

describe("authToken", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("returns null when nothing is stored", () => {
    expect(authToken.get()).toBeNull();
  });

  it("returns the token when its exp claim is in the future", () => {
    const token = makeToken({ exp: Math.floor(Date.now() / 1000) + 3600 });
    authToken.set(token);
    expect(authToken.get()).toBe(token);
  });

  it("returns null and clears storage once the token's exp claim is in the past", () => {
    const token = makeToken({ exp: Math.floor(Date.now() / 1000) - 3600 });
    authToken.set(token);
    expect(authToken.get()).toBeNull();
    expect(localStorage.getItem("wte_auth_token")).toBeNull();
  });

  it("treats a token with no exp claim as already expired", () => {
    authToken.set(makeToken({ sub: "u1" }));
    expect(authToken.get()).toBeNull();
  });

  it("treats a malformed (non-JWT-shaped) token as already expired instead of throwing", () => {
    authToken.set("not-a-real-token");
    expect(authToken.get()).toBeNull();
  });

  it("set() persists the token so a later get() can read it back", () => {
    const token = makeToken({ exp: Math.floor(Date.now() / 1000) + 60 });
    authToken.set(token);
    expect(localStorage.getItem("wte_auth_token")).toBe(token);
  });

  it("clear() removes the stored token", () => {
    authToken.set(makeToken({ exp: Math.floor(Date.now() / 1000) + 60 }));
    authToken.clear();
    expect(authToken.get()).toBeNull();
  });
});
