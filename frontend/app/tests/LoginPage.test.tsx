import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginPage } from "../pages/LoginPage";
import { useApp } from "../context/AppContext";
import { authService } from "../services/authService";
import { authToken } from "../services/authToken";
import { createAppState } from "./mockApp";

vi.mock("../context/AppContext", () => ({ useApp: vi.fn() }));
vi.mock("../services/authService", () => ({ authService: { login: vi.fn() } }));
vi.mock("../services/authToken", () => ({ authToken: { set: vi.fn(), get: vi.fn(), clear: vi.fn() } }));
const mockedUseApp = vi.mocked(useApp);
const mockedLogin = vi.mocked(authService.login);

function mockApp(overrides: Parameters<typeof createAppState>[0] = {}) {
  mockedUseApp.mockReturnValue(createAppState(overrides));
}

describe("LoginPage", () => {
  beforeEach(() => {
    mockApp();
    mockedLogin.mockReset();
  });

  it("renders the centered brand logo and test-account hint", () => {
    render(<LoginPage />);
    expect(screen.getByAltText("开饭猫")).toHaveAttribute("src", "/assets/logo-characters.png");
    expect(screen.getByText("+86 800800")).toBeInTheDocument();
  });

  it("shows a loading state while login is pending", () => {
    mockedLogin.mockReturnValue(new Promise(() => {}));
    mockApp({ phone: "800800", password: "123456", agreed: true });
    render(<LoginPage />);
    fireEvent.click(screen.getByRole("button", { name: "登录" }));
    expect(screen.getByText("正在登录中～")).toBeInTheDocument();
    expect(screen.getByAltText("开饭猫正在登录")).toHaveAttribute("src", "/assets/login-loading.png");
  });

  it("disables the login button until phone, password and agreement are set", () => {
    render(<LoginPage />);
    expect(screen.getByRole("button", { name: "登录" })).toBeDisabled();
  });

  it("logs in and navigates home with the correct test credentials", async () => {
    const go = vi.fn();
    const setLoginError = vi.fn();
    mockedLogin.mockResolvedValue("signed-jwt-token");
    mockApp({
      phone: "800800",
      password: "123456",
      agreed: true,
      go,
      setLoginError,
    });
    render(<LoginPage />);
    const button = screen.getByRole("button", { name: "登录" });
    expect(button).not.toBeDisabled();
    fireEvent.click(button);
    await waitFor(() => expect(go).toHaveBeenCalledWith("home"));
    expect(authToken.set).toHaveBeenCalledWith("signed-jwt-token");
    expect(setLoginError).toHaveBeenCalledWith("");
  });

  it("shows an error and does not navigate with the wrong password", async () => {
    const go = vi.fn();
    const setLoginError = vi.fn();
    mockedLogin.mockRejectedValue(new Error("账号或密码不正确"));
    mockApp({
      phone: "800800",
      password: "wrong",
      agreed: true,
      go,
      setLoginError,
    });
    render(<LoginPage />);
    fireEvent.click(screen.getByRole("button", { name: "登录" }));
    await waitFor(() => expect(setLoginError).toHaveBeenCalledWith("账号或密码不正确"));
    expect(go).not.toHaveBeenCalled();
  });

  it("toggles password visibility", () => {
    const setShowPassword = vi.fn();
    mockApp({ setShowPassword });
    render(<LoginPage />);
    fireEvent.click(screen.getByText("显示"));
    expect(setShowPassword).toHaveBeenCalledTimes(1);
  });

  it("opens the legal overlay via setLegal", () => {
    const setLegal = vi.fn();
    mockApp({ setLegal });
    render(<LoginPage />);
    fireEvent.click(screen.getByText("《用户协议》"));
    expect(setLegal).toHaveBeenCalledWith("用户协议");
  });

  it("shows a toast for unavailable login methods", () => {
    const say = vi.fn();
    mockApp({ say });
    render(<LoginPage />);
    fireEvent.click(screen.getByLabelText("微信登录"));
    expect(say).toHaveBeenCalledWith("该登录方式暂未开放");
  });
});
