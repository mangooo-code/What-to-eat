import { apiClient } from "./apiClient";

export interface LoginRequest {
  phoneNumber: string;
  password: string;
}

export const authService = {
  login: (request: LoginRequest) => apiClient.post<string, LoginRequest>("/login", request),
};
