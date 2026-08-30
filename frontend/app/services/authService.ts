import { ApiClientError, apiClient } from "./apiClient";

export interface LoginRequest {
  phoneNumber: string;
  password: string;
}

export const authService = {
  login: (request: LoginRequest) => apiClient.post<string, LoginRequest>("/login", request),
};

export function getLoginErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.status === 401 || error.code === "INVALID_CREDENTIALS") {
      return "抱歉，账号或密码不正确";
    }
    if (error.status === 404) {
      return "抱歉，服务当前不可用，请稍后重试";
    }
    if (error.code === "REQUEST_TIMEOUT" || error.code === "NETWORK_ERROR") {
      return "网络连接异常，请检查网络后重试";
    }
  }
  return "登录失败，请稍后重试";
}
