import { authenticate, AuthenticationError } from "./service";

interface AuthenticationEvent {
  httpMethod?: string;
  requestContext?: {
    httpMethod?: string;
  };
  body?: string | Record<string, unknown> | null;
  isBase64Encoded?: boolean;
}

interface AuthenticationRequest {
  phoneNumber?: unknown;
  password?: unknown;
}

interface HttpResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

const jsonResponse = (statusCode: number, body: unknown): HttpResponse => ({
  statusCode,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  },
  body: JSON.stringify(body)
});

const parseBody = (event: AuthenticationEvent): AuthenticationRequest | null => {
  if (event.body == null) {
    return null;
  }

  if (typeof event.body === "object") {
    return event.body;
  }

  const body = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;

  return JSON.parse(body) as AuthenticationRequest;
};

export const main = async (event: AuthenticationEvent = {}): Promise<HttpResponse> => {
  const method = (event.httpMethod || event.requestContext?.httpMethod || "").toUpperCase();

  if (method !== "POST") {
    const response = jsonResponse(405, { error: "Method not allowed" });
    response.headers.allow = "POST";
    return response;
  }

  let body: AuthenticationRequest | null;
  try {
    body = parseBody(event);
  } catch {
    return jsonResponse(400, { error: "Request body must be valid JSON" });
  }

  const phoneNumber = typeof body?.phoneNumber === "string" ? body.phoneNumber.trim() : "";
  const password = body?.password;

  if (!phoneNumber || typeof password !== "string" || password.length === 0) {
    return jsonResponse(400, { error: "phoneNumber and password are required" });
  }

  try {
    const session = await authenticate({ phoneNumber, password });
    return jsonResponse(200, session);
  } catch (error: unknown) {
    if (error instanceof AuthenticationError && error.code === "INVALID_CREDENTIALS") {
      return jsonResponse(401, { error: "Invalid credentials" });
    }

    console.error("Authentication failed", error);
    return jsonResponse(500, { error: "Authentication failed" });
  }
};