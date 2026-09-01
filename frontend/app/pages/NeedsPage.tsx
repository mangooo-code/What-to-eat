"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "../styles/pages/needs.css";
import { useApp } from "../context/AppContext";
import { Choice } from "../components/Choice";
import { Header } from "../components/Header";
import { AssetImage } from "../components/AssetImage";
import { limits } from "../lib/data";
import { memberService } from "../services/memberService";
import type { HouseholdMember } from "../types/domain";

export function NeedsPage() {
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
    other,
    setOther,
    otherLimit,
    setOtherLimit,
    needError,
    setNeedError,
    go,
  } = useApp();
  const [visibleMemberIds, setVisibleMemberIds] = useState<string[]>([]);
  const [memberPickerOpen, setMemberPickerOpen] = useState(false);
  const [pickerMembers, setPickerMembers] = useState<HouseholdMember[]>([]);
  useEffect(() => {
    memberService.list({ excludeOwner: true }).then(setPickerMembers).catch(() => {});
  }, []);
  const visibleMembers = pickerMembers.filter((member) =>
    visibleMemberIds.includes(member.memberId),
  );
  const pickableMembers = pickerMembers.filter(
    (member) => !visibleMemberIds.includes(member.memberId),
  );
  const missing = time ? 0 : 1;
  return (
    <>
      <Header
        title="这一顿想怎么吃？"
        sub="告诉我今天的需求，我来帮你缩小选择范围。"
        back={() => go("home")}
      />
      <div className="needs-layout">
        <section className="need-card">
          <h2>今天有多少时间？</h2>
          <div className="option-grid">
            {["快速解决（15–30 分钟）", "慢慢做饭（30 分钟以上）"].map((x) => (
              <Choice
                key={x}
                label={x}
                selected={time === x}
                onClick={() => setTime(x)}
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
              <p className="member-empty">目前只有我们！</p>
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
              <button
                className="modal-close"
                aria-label="关闭"
                onClick={() => setMemberPickerOpen(false)}
              >
                ×
              </button>
              <h2 id="member-picker-title">选择就餐人</h2>
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
              <div className="actions">
                <button onClick={() => setMemberPickerOpen(false)}>完成</button>
              </div>
            </div>
          </div>,
          document.body,
        )}
        <section className="need-card full">
          <div className="card-header-row">
            <h2>今天想吃什么口味？</h2>
            <label className="toggle-row">
              <span>
                <strong>优先喜欢过的菜谱</strong>
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
                  onClick={() => setTaste(x)}
                >
                  <AssetImage
                    name={{
                      "按平时口味": "based-on-usual-taste.png",
                      "重口过瘾": "bold-and-satisfying.png",
                      "家常下饭": "home-style-meal.png",
                      "清淡爽口": "light-and-refreshing.png",
                      "健康轻食": "healthy-light-meal.png",
                    }[x]!}
                    alt=""
                  />
                  {x}
                </button>
              ),
            )}
          </div>
        </section>
        <section className="need-card full">
          <h2>这顿有什么不吃的</h2>
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
          <button className="link other-limit" type="button" onClick={() => setOther(true)}>
            ＋ 添加其他限制
          </button>
          {other && (
            <div className="other-limit-input">
              <input
                value={otherLimit}
                onChange={(e) => setOtherLimit(e.target.value)}
                placeholder="输入这顿不吃的食材或要求"
                aria-label="输入这顿不吃的食材或要求"
              />
              <button
                type="button"
                disabled={!otherLimit.trim()}
                onClick={() => {
                  const v = otherLimit.trim();
                  setChosenLimits((a) => (a.includes(v) ? a : [...a, v]));
                  setOtherLimit("");
                  setOther(false);
                }}
              >
                确认添加
              </button>
            </div>
          )}
        </section>
      </div>
      <div className="sticky-actions">
        {missing > 0 && (
          <p className={needError ? "error" : ""} role={needError ? "alert" : undefined}>还有 {missing} 项没有完成</p>
        )}
        <button
          className="primary"
          disabled={missing > 0}
          onClick={() =>
            missing ? setNeedError(true) : go("recommend-loading")
          }
        >
          帮我挑一挑
        </button>
      </div>
    </>
  );
}
