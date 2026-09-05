"use client";
import { useEffect, useState } from "react";
import "../styles/pages/login.css";
import { useApp } from "../context/AppContext";
import { AssetImage } from "../components/AssetImage";
import { authService, getLoginErrorMessage } from "../services/authService";
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
  const [displayedError, setDisplayedError] = useState("");
  const [errorToken, setErrorToken] = useState(0);
  useEffect(() => {
    if (loginError) setDisplayedError(loginError);
  }, [loginError]);
  useEffect(() => {
    if (!loginError) return;
    const t = setTimeout(() => setLoginError(""), 5000);
    return () => clearTimeout(t);
  }, [loginError, errorToken, setLoginError]);
  const submit = async () => {
    setSubmitting(true);
    try {
      const token = await authService.login({ phoneNumber: phone.trim(), password });
      authToken.set(token);
      await Promise.all([loadCurrentUser(), loadMembers()]);
      setLoginError("");
      setPassword("");
      // replace() so the back button can't return to the login page with stale credentials
      go("home", { replace: true });
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setLoginError(getLoginErrorMessage(error));
      setErrorToken((t) => t + 1);
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className="login-page">
      <header className="login-logo-header">
        <AssetImage name="logo-characters.png" alt="开饭猫" className="login-logo" />
      </header>
      <div className="login-hero-stage asset-hero login-hero-image">
        <AssetImage
          name="login-hero.png"
          alt="开饭猫欢迎你"
          className={`login-hero-frame${submitting ? "" : " visible"}`}
        />
        <AssetImage
          name="login-loading.png"
          alt="开饭猫正在登录"
          className={`login-hero-frame${submitting ? " visible" : ""}`}
        />
      </div>
      <div className="login-form">
        <label>
          手机号
          <span className="phone-input">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              aria-label="国家或地区区号"
              disabled={submitting}
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
              disabled={submitting}
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
              disabled={submitting}
            />
            <button onClick={() => setShowPassword((v) => !v)} disabled={submitting} aria-label={showPassword ? "隐藏密码" : "显示密码"}>
              {showPassword ? "隐藏" : "显示"}
            </button>
          </span>
        </label>
        <div className="test-account">
          <strong>测试账号</strong>
          <span>+86 800800</span>
          <span>密码：123456</span>
        </div>
        <p className={`login-error${loginError ? " visible" : ""}`} role="alert">
          {displayedError}
          <span className="login-error-progress" key={errorToken} />
        </p>
        <label className="agreement">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            disabled={submitting}
          />
          <span>
            我已阅读并同意 
            {"\u300A"}<button type="button" className="legal-link" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setLegal("用户协议"); }}>用户协议</button>{"\u300B"}
             和 
            {"\u300A"}<button type="button" className="legal-link" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setLegal("隐私政策"); }}>隐私政策</button>{"\u300B"}
          </span>
        </label>
        <button className="primary" disabled={!enabled || submitting} onClick={submit}>
          {submitting ? <span className="button-spinner" role="status" aria-label="登录中" /> : "登录"}
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
