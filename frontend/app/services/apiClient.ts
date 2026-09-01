import type { ApiResponse } from "../types/api";
import { authToken } from "./authToken";

const DEFAULT_TIMEOUT_MS = 10_000;

export class ApiClientError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export interface ApiClientOptions {
  baseUrl?: string;
  timeoutMs?: number;
  getAuthHeaders?: () => Promise<Record<string, string>> | Record<string, string>;
}

export interface RequestOptions {
  query?: Record<string, string | number | boolean | null | undefined>;
  timeoutMs?: number;
  signal?: AbortSignal;
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly getAuthHeaders?: ApiClientOptions["getAuthHeaders"];

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.getAuthHeaders = options.getAuthHeaders;
  }

  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>("GET", path, undefined, options);
  }

  post<TResponse, TBody = unknown>(path: string, body?: TBody, options?: RequestOptions): Promise<TResponse> {
    return this.request<TResponse>("POST", path, body === undefined ? undefined : JSON.stringify(body), options, "application/json");
  }

  postFormData<TResponse>(path: string, body: FormData, options?: RequestOptions): Promise<TResponse> {
    return this.request<TResponse>("POST", path, body, options);
  }

  patch<TResponse, TBody = unknown>(path: string, body?: TBody, options?: RequestOptions): Promise<TResponse> {
    return this.request<TResponse>("PATCH", path, body === undefined ? undefined : JSON.stringify(body), options, "application/json");
  }

  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>("DELETE", path, undefined, options);
  }

  private async request<T>(method: string, path: string, body?: BodyInit, options: RequestOptions = {}, contentType?: string): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? this.timeoutMs);
    const abort = () => controller.abort();
    options.signal?.addEventListener("abort", abort, { once: true });

    try {
      const authHeaders = (await this.getAuthHeaders?.()) ?? {};
      const response = await fetch(this.buildUrl(path, options.query), {
        method,
        headers: { ...(contentType ? { "content-type": contentType } : {}), ...authHeaders },
        body,
        signal: controller.signal,
      });
      const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;

      if (!response.ok || !payload || !payload.success) {
        const error = payload && !payload.success ? payload.error : null;
        throw new ApiClientError(error?.code ?? "HTTP_ERROR", error?.message ?? `Request failed with status ${response.status}`, response.status);
      }

      return payload.data;
    } catch (error) {
      if (error instanceof ApiClientError) throw error;
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new ApiClientError("REQUEST_TIMEOUT", "Request timed out");
      }
      throw new ApiClientError("NETWORK_ERROR", error instanceof Error ? error.message : "Network request failed");
    } finally {
      clearTimeout(timeout);
      options.signal?.removeEventListener("abort", abort);
    }
  }

  private buildUrl(path: string, query?: RequestOptions["query"]): string {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const url = new URL(`${this.baseUrl}${normalizedPath}`, typeof window === "undefined" ? "http://localhost" : window.location.origin);
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== null && value !== undefined) url.searchParams.set(key, String(value));
    }
    return url.toString();
  }
}

export const apiClient = new ApiClient({
  getAuthHeaders: (): Record<string, string> => {
    const token = authToken.get();
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  },
});
