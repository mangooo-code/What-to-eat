import { apiClient } from "./apiClient";
import type { User } from "../types/domain";

export interface LoginRequest {
  phoneNumber: string;
  password: string;
}

export interface AuthSession {
  token: string;
  expiresAt: string;
  user: User;
}

export const authService = {
  login: (request: LoginRequest) => apiClient.post<AuthSession, LoginRequest>("/auth/login", request),
  me: () => apiClient.get<User>("/auth/me"),
  logout: () => apiClient.post<void>("/auth/logout"),
};
