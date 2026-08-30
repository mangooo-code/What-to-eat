"use client";
import { useState } from "react";
import "../styles/pages/login.css";
import { useApp } from "../context/AppContext";
import { AssetImage } from "../components/AssetImage";
import { authService } from "../services/authService";
import { authToken } from "../services/authToken";

export function LoginPage() {
  const [submitting, setSubmitting] = useState(false);
  const {
    countryCode,
    setCountryCode,
    phone,
    setPhone,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    agreed,
    setAgreed,
    loginError,
    setLoginError,
    setLegal,
    go,
    say,
    loadCurrentUser,
    loadMembers,
  } = useApp();
  const enabled = phone.trim() && password && agreed;
  const submit = async () => {
    setSubmitting(true);
    try {
      const token = await authService.login({ phoneNumber: phone.trim(), password });
      authToken.set(token);
      await Promise.all([loadCurrentUser(), loadMembers()]);
      setLoginError("");
      go("home");
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "账号或密码不正确");
    } finally {
      setSubmitting(false);
    }
  };
  if (submitting) {
    return (
      <div className="login-loading-state" role="status" aria-live="polite">
        <AssetImage name="login-loading.png" alt="开饭猫正在登录" className="login-loading-image" />
        <h1>正在登录中～</h1>
      </div>
    );
  }
  return (
    <div className="login-page">
      <header className="login-logo-header">
        <AssetImage name="logo-characters.png" alt="开饭猫" className="login-logo" />
      </header>
      <AssetImage name="login-hero.png" alt="开饭猫欢迎你" className="asset-hero login-hero-image" />
      <p className="login-subtitle">手机号密码登录</p>
      <div className="login-form">
        <label>
          手机号
          <span className="phone-input">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              aria-label="国家或地区区号"
            >
              <option>+86</option>
              <option>+852</option>
              <option>+853</option>
              <option>+886</option>
              <option>+1</option>
            </select>
            <input
              value={phone}
              inputMode="numeric"
              onChange={(e) => setPhone(e.target.value)}
              placeholder="请输入手机号"
            />
          </span>
        </label>
        <label>
          密码
          <span className="password-input">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
            />
            <button onClick={() => setShowPassword((v) => !v)}>
              {showPassword ? "隐藏" : "显示"}
            </button>
          </span>
        </label>
        <div className="test-account">
          <strong>测试账号</strong>
          <span>+86 800800</span>
          <span>密码：123456</span>
        </div>
        {loginError && <p className="login-error">{loginError}</p>}
        <label className="agreement">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <span>
            我已阅读并同意
            <button onClick={() => setLegal("用户协议")}>《用户协议》</button>
            和
            <button onClick={() => setLegal("隐私政策")}>《隐私政策》</button>
          </span>
        </label>
        <button className="primary" disabled={!enabled || submitting} onClick={submit}>
          登录
        </button>
        <p className="other-login-title">其他登录方式</p>
        <div className="other-login">
          <button
            aria-label="微信登录"
            onClick={() => say("该登录方式暂未开放")}
          >
            <AssetImage name="wechat-icon.png" alt="" />
          </button>
          <button
            aria-label="Apple 登录"
            onClick={() => say("该登录方式暂未开放")}
          >
            <AssetImage name="apple-icon.png" alt="" />
          </button>
        </div>
      </div>
    </div>
  );
}
