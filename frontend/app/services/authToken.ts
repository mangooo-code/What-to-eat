const TOKEN_KEY = "wte_auth_token";

function decodeExpiryMs(token: string): number {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const claims = JSON.parse(json) as { exp?: number };
    return typeof claims.exp === "number" ? claims.exp * 1000 : 0;
  } catch {
    return 0;
  }
}

export const authToken = {
  get(): string | null {
    if (typeof window === "undefined") return null;
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    if (decodeExpiryMs(token) <= Date.now()) {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return token;
  },
  set(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
  },
};
