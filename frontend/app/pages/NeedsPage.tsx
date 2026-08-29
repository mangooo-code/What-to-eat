"use client";
import "../styles/pages/needs.css";
import { useApp } from "../context/AppContext";
import { Choice } from "../components/Choice";
import { Header } from "../components/Header";
import { Placeholder } from "../components/Placeholder";
import { limits } from "../lib/data";

export function NeedsPage() {
  const {
    time,
    setTime,
    people,
    members,
    setMembers,
    openMember,
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
          <h2>今天和谁一起吃？</h2>
          <div className="chips member-options">
            {people.map((x) => (
              <button
                className={members.includes(x) ? "active" : ""}
                key={x}
                onClick={() =>
                  setMembers((a) =>
                    a.includes(x) ? a.filter((v) => v !== x) : [...a, x],
                  )
                }
              >
                {x}
              </button>
            ))}
            <button onClick={() => openMember("needs")}>＋ 添加成员</button>
          </div>
        </section>
        <section className="need-card">
          <h2>今天想吃什么口味？</h2>
          <div className="chips option-cards icon-options">
            {["按平时口味", "重口过瘾", "家常下饭", "清淡爽口", "健康轻食"].map(
              (x) => (
                <button
                  className={taste === x ? "active" : ""}
                  key={x}
                  onClick={() => setTaste(x)}
                >
                  <Placeholder kind="icon" />
                  {x}
                </button>
              ),
            )}
          </div>
        </section>
        <section className="need-card preference-card">
          <label className="toggle-row">
            <span>
              <strong>喜欢的菜谱优先</strong>
              <small>优先考虑之前喜欢过的菜谱</small>
            </span>
            <input
              type="checkbox"
              checked={prefer}
              onChange={(e) => setPrefer(e.target.checked)}
            />
            <i className={`switch ${prefer ? "on" : ""}`}>
              {prefer ? "ON" : "OFF"}
            </i>
          </label>
        </section>
        <section className="need-card full">
          <h2>这顿有什么不吃的？</h2>
          <div className="chips option-cards">
            {[...limits, ...chosenLimits.filter((x) => !limits.includes(x))].map(
              (x) => (
                <button
                  className={chosenLimits.includes(x) ? "active" : ""}
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
          <button className="link other-limit" onClick={() => setOther(true)}>
            ＋ 添加其他限制
          </button>
          {other && (
            <div className="other-limit-input">
              <input
                value={otherLimit}
                onChange={(e) => setOtherLimit(e.target.value)}
                placeholder="输入这顿不吃的食材或要求"
              />
              <button
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
          <p className={needError ? "error" : ""}>还有 {missing} 项没有完成</p>
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
