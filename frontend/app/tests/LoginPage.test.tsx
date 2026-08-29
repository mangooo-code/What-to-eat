import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginPage } from "../pages/LoginPage";
import { useApp } from "../context/AppContext";
import { createAppState } from "./mockApp";

vi.mock("../context/AppContext", () => ({ useApp: vi.fn() }));
const mockedUseApp = vi.mocked(useApp);

function mockApp(overrides: Parameters<typeof createAppState>[0] = {}) {
  mockedUseApp.mockReturnValue(createAppState(overrides));
}

describe("LoginPage", () => {
  beforeEach(() => {
    mockApp();
  });

  it("renders the title and test-account hint", () => {
    render(<LoginPage />);
    expect(screen.getByText("今天吃什么")).toBeInTheDocument();
    expect(screen.getByText("+86 800800")).toBeInTheDocument();
  });

  it("disables the login button until phone, password and agreement are set", () => {
    render(<LoginPage />);
    expect(screen.getByRole("button", { name: "登录" })).toBeDisabled();
  });

  it("logs in and navigates home with the correct test credentials", () => {
    const go = vi.fn();
    const setLoginError = vi.fn();
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
    expect(go).toHaveBeenCalledWith("home");
    expect(setLoginError).toHaveBeenCalledWith("");
  });

  it("shows an error and does not navigate with the wrong password", () => {
    const go = vi.fn();
    const setLoginError = vi.fn();
    mockApp({
      phone: "800800",
      password: "wrong",
      agreed: true,
      go,
      setLoginError,
    });
    render(<LoginPage />);
    fireEvent.click(screen.getByRole("button", { name: "登录" }));
    expect(go).not.toHaveBeenCalled();
    expect(setLoginError).toHaveBeenCalledWith(
      "账号或密码不正确，请使用测试账号登录",
    );
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
