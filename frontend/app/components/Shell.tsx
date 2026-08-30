"use client";
import "../styles/components/nav.css";
import "../styles/components/member-modal.css";
import { useState, type ReactNode } from "react";
import { useApp } from "../context/AppContext";
import { AssetImage } from "./AssetImage";
import { ProfileForm } from "./ProfileForm";
import { inventoryService } from "../services/inventoryService";

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
    memberSaving,
    draftTaste,
    setDraftTaste,
    draftDiet,
    setDraftDiet,
    draftLimits,
    setDraftLimits,
    draftAllergens,
    setDraftAllergens,
    dialog,
    setDialog,
    logout,
    say,
    setFoods,
    foods,
    editIndex,
  } = useApp();
  const [deleting, setDeleting] = useState(false);

  const nav = (
    <nav className="bottom-nav">
      <button
        className={page === "fridge" ? "active" : ""}
        onClick={() => go("fridge")}
      >
        <AssetImage name="fridge.png" alt="冰箱" />
        冰箱
      </button>
      <button
        className={page === "home" ? "active" : ""}
        onClick={() => go("home")}
      >
        <AssetImage name="what-to-eat-today.png" alt="今天吃什么" />
        今天吃什么
      </button>
      <button
        className={page === "profile" ? "active" : ""}
        onClick={() => go("profile")}
      >
        <AssetImage name="profile.png" alt="我的" />
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
            <p>「{legal}」正在开发中</p>
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
              <ProfileForm
                value={{ taste: draftTaste, diet: draftDiet, limits: draftLimits, allergens: draftAllergens }}
                onChange={(data) => {
                  setDraftTaste(data.taste);
                  setDraftDiet(data.diet);
                  setDraftLimits(data.limits);
                  setDraftAllergens(data.allergens);
                }}
              />
            </div>
            <div className="modal-edit-actions">
              <button onClick={() => setMemberOpen(false)}>取消</button>
              <button
                className="primary"
                disabled={!newMemberName.trim() || !relation || memberSaving}
                onClick={saveMember}
              >
                {memberSaving ? "保存中……" : "保存档案"}
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
                : dialog.includes("删除") || dialog.includes("移除")
                  ? "移除后，这项食材不会再参与菜谱推荐。"
                  : dialog.includes("结束")
                    ? "结束后不会更新冰箱库存，也不会生成本次制作记录。"
                    : "请确认本次操作。"}
            </p>
            <div className="actions">
              <button onClick={() => setDialog("")}>取消</button>
              <button
                className="danger"
                disabled={deleting}
                onClick={async () => {
                  if (dialog.includes("退出")) logout();
                  else {
                    if (dialog.includes("删除") || dialog.includes("移除")) {
                      const ingredient = foods[editIndex];
                      if (!ingredient?.id) {
                        say("删除失败：库存数据缺少稳定 ID");
                        return;
                      }
                      setDeleting(true);
                      try {
                        await inventoryService.remove(ingredient.id);
                        setFoods((items) => items.filter((food) => food.id !== ingredient.id));
                        setDialog("");
                        say("食材已删除");
                        go("fridge");
                      } catch (error) {
                        say(`删除失败：${error instanceof Error ? error.message : "请稍后重试"}`);
                      } finally {
                        setDeleting(false);
                      }
                      return;
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
                  : deleting
                    ? "删除中……"
                    : "删除"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
