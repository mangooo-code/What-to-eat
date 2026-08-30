import { apiClient } from "./apiClient";
import type { User } from "../types/domain";

export const userService = {
  getProfile: () => apiClient.get<User>("/user"),
};
