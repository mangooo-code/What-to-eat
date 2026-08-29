"use client";
import "../styles/components/nav.css";
import "../styles/components/member-modal.css";
import type { ReactNode } from "react";
import { useApp } from "../context/AppContext";
import { Placeholder } from "./Placeholder";
import { ProfileForm } from "./ProfileForm";

export function Shell({
  children,
  withNav = false,
}: {
  children: ReactNode;
  withNav?: boolean;
}) {
  const {
    page,
    go,
    toast,
    legal,
    setLegal,
    memberOpen,
    setMemberOpen,
    memberMode,
    newMemberName,
    setNewMemberName,
    relation,
    setRelation,
    saveMember,
    dialog,
    setDialog,
    logout,
    setFoods,
    editIndex,
  } = useApp();

  const nav = (
    <nav className="bottom-nav">
      <button
        className={page === "fridge" ? "active" : ""}
        onClick={() => go("fridge")}
      >
        <Placeholder kind="icon" />
        冰箱
      </button>
      <button
        className={page === "home" ? "active" : ""}
        onClick={() => go("home")}
      >
        <Placeholder kind="icon" />
        今天吃什么
      </button>
      <button
        className={page === "profile" ? "active" : ""}
        onClick={() => go("profile")}
      >
        <Placeholder kind="icon" />
        我的
      </button>
    </nav>
  );

  return (
    <main className="app-shell">
      <section className="page">{children}</section>
      {withNav && nav}
      {toast && <div className="toast">{toast}</div>}
      {legal && (
        <div className="overlay">
          <div className="dialog">
            <button className="modal-close" onClick={() => setLegal("")}>
              ×
            </button>
            <h2>{legal}</h2>
            <p>这里是「{legal}」的低保真内容占位。</p>
          </div>
        </div>
      )}
      {memberOpen && (
        <div className="overlay">
          <div className="member-modal">
            <div className="member-modal-head">
              <h2>
                {memberMode === "edit" ? "修改成员档案" : "添加一起吃饭的人"}
              </h2>
              <button
                className="modal-close"
                onClick={() => setMemberOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="member-modal-body">
              <div className="member-basic">
                <label className="label">
                  姓名 / 昵称
                  <input
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="输入姓名或昵称"
                  />
                </label>
                <label className="label">
                  关系
                  <select
                    value={relation}
                    onChange={(e) => setRelation(e.target.value)}
                  >
                    <option value="">请选择关系</option>
                    {["伴侣", "家人", "朋友", "其他"].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
              </div>
              <ProfileForm />
            </div>
            <div className="modal-edit-actions">
              <button onClick={() => setMemberOpen(false)}>取消</button>
              <button
                className="primary"
                disabled={!newMemberName.trim() || !relation}
                onClick={saveMember}
              >
                保存档案
              </button>
            </div>
          </div>
        </div>
      )}
      {dialog && (
        <div className="overlay">
          <div className="dialog">
            <h2>{dialog}</h2>
            <p>
              {dialog.includes("退出")
                ? "退出后将返回登录页，不会删除冰箱、档案和菜谱数据。"
                : dialog.includes("删除")
                  ? "删除后，这项食材不会再参与菜谱推荐。"
                  : dialog.includes("结束")
                    ? "结束后不会更新冰箱库存，也不会生成本次制作记录。"
                    : "请确认本次操作。"}
            </p>
            <div className="actions">
              <button onClick={() => setDialog("")}>取消</button>
              <button
                className="danger"
                onClick={() => {
                  if (dialog.includes("退出")) logout();
                  else {
                    if (dialog.includes("删除")) {
                      setFoods((f) => f.filter((_, i) => i !== editIndex));
                      go("fridge");
                    }
                    if (dialog.includes("结束")) go("home");
                    setDialog("");
                  }
                }}
              >
                {dialog.includes("退出")
                  ? "确认退出"
                  : dialog.includes("结束")
                    ? "结束制作"
                    : "删除"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
