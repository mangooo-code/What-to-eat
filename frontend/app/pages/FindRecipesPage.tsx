"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "../styles/pages/findrecipes.css";
import { useApp } from "../context/AppContext";
import { Choice } from "../components/Choice";
import { Header } from "../components/Header";
import { AssetImage } from "../components/AssetImage";
import { LoadingSequence } from "../components/LoadingSequence";
import { limits } from "../lib/data";
import { memberService } from "../services/memberService";
import { findRecipesService } from "../services/findRecipesService";
import type { HouseholdMember } from "../types/domain";

const tasteImages: Record<string, string> = {
  "按平时口味": "based-on-usual-taste.png",
  "重口过瘾": "bold-and-satisfying.png",
  "家常下饭": "home-style-meal.png",
  "清淡爽口": "light-and-refreshing.png",
  "健康轻食": "healthy-light-meal.png",
};

const loadingTexts = [
  "让我想想今天吃什么好……",
  "先看看家里有什么能用的",
  "不爱吃的，我都帮你避开",
  "再挑几道今天最合适的",
];

export function FindRecipesPage() {
  const {
    time,
    setTime,
    members,
    setMembers,
    taste,
    setTaste,
    prefer,
    setPrefer,
    chosenLimits,
    setChosenLimits,
    otherLimit,
    setOtherLimit,
    setRecommendedRecipes,
    go,
    say,
    findRecipesSubmitting: submitting,
    setFindRecipesSubmitting: setSubmitting,
  } = useApp();
  const [visibleMemberIds, setVisibleMemberIds] = useState<string[]>([]);
  const [memberPickerOpen, setMemberPickerOpen] = useState(false);
  const [pickerMembers, setPickerMembers] = useState<HouseholdMember[]>([]);
  const [timeInvalid, setTimeInvalid] = useState(false);
  const [tasteInvalid, setTasteInvalid] = useState(false);
  const [checking, setChecking] = useState(false);
  const [formError, setFormError] = useState("");
  const [displayedFormError, setDisplayedFormError] = useState("");
  const [formErrorToken, setFormErrorToken] = useState(0);
  useEffect(() => {
    if (formError) setDisplayedFormError(formError);
  }, [formError]);
  useEffect(() => {
    if (!formError) return;
    const t = setTimeout(() => setFormError(""), 5000);
    return () => clearTimeout(t);
  }, [formError, formErrorToken]);
  useEffect(() => {
    memberService.list({ excludeOwner: true }).then(setPickerMembers).catch(() => {});
  }, []);
  const visibleMembers = pickerMembers.filter((member) =>
    visibleMemberIds.includes(member.memberId),
  );
  const pickableMembers = pickerMembers.filter(
    (member) => !visibleMemberIds.includes(member.memberId),
  );
  const addOtherLimit = () => {
    const v = otherLimit.trim();
    if (!v) return;
    setChosenLimits((a) => (a.includes(v) ? a : [...a, v]));
    setOtherLimit("");
  };
  const handleSubmit = async () => {
    const missingTime = !time;
    const missingTaste = !taste;
    if (missingTime || missingTaste) {
      setTimeInvalid(missingTime);
      setTasteInvalid(missingTaste);
      setFormError("还有必填项没有选择，请检查后重试。");
      setFormErrorToken((t) => t + 1);
      setChecking(true);
      setTimeout(() => setChecking(false), 500);
      return;
    }
    setSubmitting(true);
    const submission = {
      timePreference: time,
      memberIds: members,
      tastePreference: taste,
      preferLikedRecipes: prefer,
      dietaryExclusions: chosenLimits,
    };
    try {
      const [recipes] = await Promise.all([
        findRecipesService.submit(submission),
        new Promise((resolve) => setTimeout(resolve, 1000)),
      ]);
      setRecommendedRecipes(recipes);
      go("recommend");
    } catch (error) {
      setSubmitting(false);
      say(`提交失败：${error instanceof Error ? error.message : "请稍后重试"}`);
    }
  };
  if (submitting) {
    return <LoadingSequence texts={loadingTexts} />;
  }
  return (
    <>
      <Header
        title="这一顿想怎么吃？"
        sub="告诉我今天的需求，我来帮你缩小选择范围。"
        back={() => go("home")}
      />
      <form
        className="findrecipes-layout"
        onSubmit={(e) => e.preventDefault()}
      >
        <section className={`need-card${timeInvalid ? " invalid" : ""}`}>
          <h2>今天有多少时间？<span className="required-mark">*</span></h2>
          <div className="option-grid">
            {["快速解决（15–30 分钟）", "慢慢做饭（30 分钟以上）"].map((x) => (
              <Choice
                key={x}
                label={x}
                selected={time === x}
                onClick={() => {
                  const next = time === x ? "" : x;
                  setTime(next);
                  if (next) setTimeInvalid(false);
                }}
              />
            ))}
          </div>
        </section>
        <section className="need-card">
          <div className="card-header-row">
            <h2>今天还有谁一起吃？</h2>
            <button
              type="button"
              className="add-diner"
              aria-label="添加就餐人"
              onClick={() => setMemberPickerOpen(true)}
            >
              <strong>＋</strong>
            </button>
          </div>
          <div className="chips member-options">
            {visibleMembers.map((member) => (
              <span className="member-chip active" key={member.memberId}>
                <span className="member-chip-name">{member.name}</span>
                <button
                  type="button"
                  className="member-chip-remove"
                  aria-label={`移除${member.name}`}
                  onClick={() => {
                    setVisibleMemberIds((ids) => ids.filter((id) => id !== member.memberId));
                    setMembers((a) => a.filter((id) => id !== member.memberId));
                  }}
                >
                  ×
                </button>
              </span>
            ))}
            {visibleMembers.length === 0 && (
              <p className="member-empty">目前只有主用户“我”</p>
            )}
          </div>
        </section>
        {memberPickerOpen && typeof document !== "undefined" && createPortal(
          <div
            className="overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="member-picker-title"
            onClick={() => setMemberPickerOpen(false)}
          >
            <div className="dialog member-picker" onClick={(e) => e.stopPropagation()}>
              <div className="member-picker-head">
                <h2 id="member-picker-title">挑选就餐人</h2>
                <button
                  className="modal-close"
                  aria-label="关闭"
                  onClick={() => setMemberPickerOpen(false)}
                >
                  ×
                </button>
              </div>
              <div className="member-picker-list">
                {pickableMembers.map((member) => (
                  <button
                    type="button"
                    key={member.memberId}
                    onClick={() => {
                      setVisibleMemberIds((ids) => [...ids, member.memberId]);
                      setMembers((a) => (a.includes(member.memberId) ? a : [...a, member.memberId]));
                    }}
                  >
                    {member.name}
                  </button>
                ))}
                {pickableMembers.length === 0 && (
                  <p className="member-empty">没有更多成员了</p>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
        <section className={`need-card full${tasteInvalid ? " invalid" : ""}`}>
          <div className="card-header-row">
            <h2>今天想吃什么口味？<span className="required-mark">*</span></h2>
            <label className="toggle-row">
              <span>
                <strong>优先推荐喜欢的菜谱</strong>
              </span>
              <input
                type="checkbox"
                checked={prefer}
                onChange={(e) => setPrefer(e.target.checked)}
              />
              <i className={`switch ${prefer ? "on" : ""}`} aria-hidden="true">
                {prefer ? "ON" : "OFF"}
              </i>
            </label>
          </div>
          <div className="chips option-cards icon-options">
            {["按平时口味", "重口过瘾", "家常下饭", "清淡爽口", "健康轻食"].map(
              (x) => (
                <button
                  type="button"
                  className={taste === x ? "active" : ""}
                  aria-pressed={taste === x}
                  key={x}
                  onClick={() => {
                    const next = taste === x ? "" : x;
                    setTaste(next);
                    if (next) setTasteInvalid(false);
                  }}
                >
                  <AssetImage
                    name={tasteImages[x]!}
                    alt=""
                  />
                  {x}
                </button>
              ),
            )}
          </div>
        </section>
        <section className="need-card full">
          <h2>这顿有什么不吃的？</h2>
          <div className="chips option-cards">
            {[...limits, ...chosenLimits.filter((x) => !limits.includes(x))].map(
              (x) => (
                <button
                  type="button"
                  className={chosenLimits.includes(x) ? "active" : ""}
                  aria-pressed={chosenLimits.includes(x)}
                  key={x}
                  onClick={() =>
                    setChosenLimits((a) =>
                      a.includes(x) ? a.filter((v) => v !== x) : [...a, x],
                    )
                  }
                >
                  {x}
                </button>
              ),
            )}
          </div>
          <div className="other-limit-input">
            <input
              value={otherLimit}
              onChange={(e) => setOtherLimit(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                addOtherLimit();
              }}
              placeholder="输入这顿不吃的食材或要求"
              aria-label="输入这顿不吃的食材或要求"
            />
            <button
              type="button"
              disabled={!otherLimit.trim()}
              onClick={addOtherLimit}
            >
              确认添加
            </button>
          </div>
        </section>
        <p className={`findrecipes-error${formError ? " visible" : ""}`} role="alert">
          {displayedFormError}
          <span className="findrecipes-error-progress" key={formErrorToken} />
        </p>
        <button
          type="button"
          className="primary findrecipes-submit"
          disabled={checking}
          onClick={handleSubmit}
        >
          {checking ? <span className="button-spinner" role="status" aria-label="检查中" /> : "帮我挑一挑"}
        </button>
      </form>
    </>
  );
}
