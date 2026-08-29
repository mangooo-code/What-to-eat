import { AppError } from "../errors/AppError";

type QueryValue = string | number | boolean;

interface PostgrestRequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  query?: Record<string, QueryValue | undefined>;
  body?: unknown;
  prefer?: string;
}

function requireEnvironment(name: "ENV_ID" | "CLOUDBASE_API_KEY"): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new AppError("DATABASE_HTTP_NOT_CONFIGURED", `${name} is not configured`, 500);
  }
  return value;
}

function timeoutFromEnvironment(): number {
  const value = Number(process.env.DATABASE_HTTP_TIMEOUT_MS);
  return Number.isFinite(value) && value > 0 ? value : 8_000;
}

function postgrestUrl(resource: string, query?: PostgrestRequestOptions["query"]): URL {
  const envId = requireEnvironment("ENV_ID");
  const url = new URL(
    `/v1/rdb/rest/${resource.split("/").map(encodeURIComponent).join("/")}`,
    `https://${envId}.api.tcloudbasegateway.com`,
  );
  for (const [name, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.append(name, String(value));
  }
  return url;
}

export async function postgrestRequest<T>(
  resource: string,
  options: PostgrestRequestOptions = {},
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutFromEnvironment());

  try {
    const response = await fetch(postgrestUrl(resource, options.query), {
      method: options.method ?? "GET",
      headers: {
        Authorization: `Bearer ${requireEnvironment("CLOUDBASE_API_KEY")}`,
        Accept: "application/json",
        ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(options.prefer ? { Prefer: options.prefer } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    });

    const responseText = await response.text();
    const responseBody = responseText ? JSON.parse(responseText) as unknown : null;
    if (!response.ok) {
      const detail = responseBody && typeof responseBody === "object" && "message" in responseBody
        ? String(responseBody.message)
        : `PostgreSQL HTTP API returned ${response.status}`;
      throw new AppError("DATABASE_HTTP_ERROR", detail, 502);
    }
    return responseBody as T;
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new AppError("DATABASE_HTTP_TIMEOUT", "PostgreSQL HTTP API request timed out", 504);
    }
    throw new AppError("DATABASE_HTTP_ERROR", "PostgreSQL HTTP API request failed", 502);
  } finally {
    clearTimeout(timeout);
  }
}
