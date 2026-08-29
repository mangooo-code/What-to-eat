import type { User } from "../../shared/types/domain";

export interface LoginRequest {
  phoneNumber: string;
  password: string;
}

export interface AuthSession {
  token: string;
  expiresAt: string;
  user: User;
}
