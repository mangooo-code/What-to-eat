import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClient, ApiClientError } from "./apiClient";

describe("ApiClient", () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
  });

  function jsonResponse(body: unknown, init: ResponseInit = {}) {
    return new Response(JSON.stringify(body), { status: 200, ...init });
  }

  it("builds the request URL from baseUrl + path, skipping null/undefined query values", async () => {
    let capturedUrl = "";
    globalThis.fetch = vi.fn(async (url) => {
      capturedUrl = url.toString();
      return jsonResponse({ success: true, data: null });
    }) as unknown as typeof fetch;

    const client = new ApiClient({ baseUrl: "https://api.example.com" });
    await client.get("/things", { query: { a: 1, b: null, c: undefined, d: "x" } });

    expect(capturedUrl).toBe("https://api.example.com/things?a=1&d=x");
  });

  it("prefixes a leading slash onto the path when missing", async () => {
    let capturedUrl = "";
    globalThis.fetch = vi.fn(async (url) => {
      capturedUrl = url.toString();
      return jsonResponse({ success: true, data: null });
    }) as unknown as typeof fetch;

    const client = new ApiClient({ baseUrl: "https://api.example.com" });
    await client.get("things");

    expect(capturedUrl).toBe("https://api.example.com/things");
  });

  it("includes auth headers returned by getAuthHeaders", async () => {
    let capturedHeaders: Record<string, string> = {};
    globalThis.fetch = vi.fn(async (_url, init) => {
      capturedHeaders = init?.headers as Record<string, string>;
      return jsonResponse({ success: true, data: null });
    }) as unknown as typeof fetch;

    const client = new ApiClient({ getAuthHeaders: () => ({ Authorization: "Bearer xyz" }) });
    await client.get("/things");

    expect(capturedHeaders.Authorization).toBe("Bearer xyz");
  });

  it("supports an async getAuthHeaders", async () => {
    let capturedHeaders: Record<string, string> = {};
    globalThis.fetch = vi.fn(async (_url, init) => {
      capturedHeaders = init?.headers as Record<string, string>;
      return jsonResponse({ success: true, data: null });
    }) as unknown as typeof fetch;

    const client = new ApiClient({ getAuthHeaders: async () => ({ Authorization: "Bearer async" }) });
    await client.get("/things");

    expect(capturedHeaders.Authorization).toBe("Bearer async");
  });

  it("JSON-encodes the body and sets content-type for post()", async () => {
    let capturedInit: RequestInit | undefined;
    globalThis.fetch = vi.fn(async (_url, init) => {
      capturedInit = init;
      return jsonResponse({ success: true, data: { id: "1" } });
    }) as unknown as typeof fetch;

    const client = new ApiClient();
    const result = await client.post<{ id: string }>("/things", { name: "a" });

    expect(capturedInit?.method).toBe("POST");
    expect(capturedInit?.body).toBe(JSON.stringify({ name: "a" }));
    expect((capturedInit?.headers as Record<string, string>)["content-type"]).toBe("application/json");
    expect(result).toEqual({ id: "1" });
  });

  it("sends FormData as-is via postFormData, without a JSON content-type", async () => {
    let capturedInit: RequestInit | undefined;
    globalThis.fetch = vi.fn(async (_url, init) => {
      capturedInit = init;
      return jsonResponse({ success: true, data: null });
    }) as unknown as typeof fetch;

    const form = new FormData();
    form.append("image", "fake-bytes");
    const client = new ApiClient();
    await client.postFormData("/upload", form);

    expect(capturedInit?.body).toBe(form);
    expect((capturedInit?.headers as Record<string, string>)["content-type"]).toBeUndefined();
  });

  it("JSON-encodes the body for patch()", async () => {
    let capturedInit: RequestInit | undefined;
    globalThis.fetch = vi.fn(async (_url, init) => {
      capturedInit = init;
      return jsonResponse({ success: true, data: null });
    }) as unknown as typeof fetch;

    const client = new ApiClient();
    await client.patch("/things/1", { done: true });

    expect(capturedInit?.method).toBe("PATCH");
    expect(capturedInit?.body).toBe(JSON.stringify({ done: true }));
  });

  it("issues a DELETE request with no body", async () => {
    let capturedInit: RequestInit | undefined;
    globalThis.fetch = vi.fn(async (_url, init) => {
      capturedInit = init;
      return jsonResponse({ success: true, data: null });
    }) as unknown as typeof fetch;

    const client = new ApiClient();
    await client.delete("/things/1");

    expect(capturedInit?.method).toBe("DELETE");
    expect(capturedInit?.body).toBeUndefined();
  });

  it("throws ApiClientError with the server's code/message when the payload reports failure", async () => {
    globalThis.fetch = vi.fn(async () =>
      jsonResponse({ success: false, error: { code: "NOT_FOUND", message: "missing" } }, { status: 404 }),
    ) as unknown as typeof fetch;

    const client = new ApiClient();
    await expect(client.get("/things/1")).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "missing",
      status: 404,
    });
    await expect(client.get("/things/1")).rejects.toBeInstanceOf(ApiClientError);
  });

  it("throws ApiClientError with an HTTP_ERROR fallback when the response body isn't valid JSON", async () => {
    globalThis.fetch = vi.fn(async () => new Response("not json", { status: 500 })) as unknown as typeof fetch;

    const client = new ApiClient();
    await expect(client.get("/things")).rejects.toMatchObject({
      code: "HTTP_ERROR",
      status: 500,
    });
  });

  it("throws ApiClientError with REQUEST_TIMEOUT when the request exceeds its timeout", async () => {
    globalThis.fetch = vi.fn(
      (_url, init: RequestInit | undefined) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            const error = new DOMException("aborted", "AbortError");
            reject(error);
          });
        }),
    ) as unknown as typeof fetch;

    const client = new ApiClient({ timeoutMs: 5 });
    await expect(client.get("/slow")).rejects.toMatchObject({ code: "REQUEST_TIMEOUT" });
  });

  it("throws ApiClientError with NETWORK_ERROR when fetch rejects for a non-abort reason", async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new Error("boom");
    }) as unknown as typeof fetch;

    const client = new ApiClient();
    await expect(client.get("/things")).rejects.toMatchObject({ code: "NETWORK_ERROR", message: "boom" });
  });

  it("aborts the underlying request when the caller's signal is aborted", async () => {
    let sawAbort = false;
    globalThis.fetch = vi.fn((_url, init: RequestInit | undefined) => {
      const signal = init?.signal;
      return new Promise((_resolve, reject) => {
        const onAbort = () => {
          sawAbort = true;
          reject(new DOMException("aborted", "AbortError"));
        };
        if (signal?.aborted) onAbort();
        else signal?.addEventListener("abort", onAbort);
      });
    }) as unknown as typeof fetch;

    const controller = new AbortController();
    const client = new ApiClient();
    const promise = client.get("/things", { signal: controller.signal });
    await Promise.resolve();
    await Promise.resolve();
    controller.abort();

    await expect(promise).rejects.toMatchObject({ code: "REQUEST_TIMEOUT" });
    expect(sawAbort).toBe(true);
  });
});
