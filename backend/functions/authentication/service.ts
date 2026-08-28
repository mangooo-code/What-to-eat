export interface AuthenticationCredentials {
  phoneNumber: string;
  password: string;
}

export interface AuthenticationSession {
  token: string;
  expiresAt: string;
  user: {
    id: string;
    phoneNumber: string;
  };
}

export class AuthenticationError extends Error {
  constructor(public readonly code: "INVALID_CREDENTIALS") {
    super(code);
    this.name = "AuthenticationError";
  }
}

export const authenticate = async (
  credentials: AuthenticationCredentials
): Promise<AuthenticationSession> => {
  void credentials;

  throw new Error("Authentication provider is not configured");
};