import { beforeEach, describe, expect, it, vi } from "vitest";
import { authToken } from "./authToken";
import { recognitionService } from "./recognitionService";

describe("recognitionService", () => {
  beforeEach(() => {
    vi.spyOn(authToken, "get").mockReturnValue("test-token");
  });

  it("posts exactly one real image File as multipart form data", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      data: { items: [] },
    }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }));
    vi.stubGlobal("fetch", fetchMock);
    const image = new File(["binary image content"], "ingredients.png", { type: "image/png" });

    await recognitionService.recognizeIngredients(image);

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(options.method).toBe("POST");
    expect(options.body).toBeInstanceOf(FormData);
    expect((options.body as FormData).getAll("image")).toEqual([image]);
    expect(new Headers(options.headers).has("content-type")).toBe(false);
    expect(new Headers(options.headers).get("authorization")).toBe("Bearer test-token");
  });
});
