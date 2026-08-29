"use client";
import "../styles/pages/profile.css";
import { useApp } from "../context/AppContext";
import { Header } from "../components/Header";
import { Placeholder } from "../components/Placeholder";

export function ProfilePage() {
  const { people, profileData, openRecipes, openMember, openDiet, setDialog } =
    useApp();
  return (
    <>
      <Header title="我的" />
      <div className="person">
        <Placeholder />
        <div>
          <h2>
            佳美 <span className="profile-tag">主用户</span>
          </h2>
          <p>+86 800800</p>
          <small>ID：102837658</small>
        </div>
      </div>
      <section className="block recipe-shortcuts">
        <h2>我的菜谱</h2>
        <div>
          <button type="button" onClick={() => openRecipes("done")}>
            <Placeholder kind="icon" />
            <span>
              <strong>历史菜谱</strong>
              <small>8 条做饭记录</small>
            </span>
            <b>›</b>
          </button>
          <button type="button" onClick={() => openRecipes("liked")}>
            <Placeholder kind="icon" />
            <span>
              <strong>喜欢的菜谱</strong>
              <small>5 道心水菜</small>
            </span>
            <b>›</b>
          </button>
        </div>
      </section>
      <section className="block profile-section">
        <div className="section-heading">
          <span>
            <h2>用户档案</h2>
            <p>记录一起吃饭的人的饮食偏好。</p>
          </span>
          <button
            className="secondary compact-add"
            onClick={() => openMember("profile")}
          >
            ＋ 添加成员
          </button>
        </div>
        <div className="profile-list">
          {people.map((name, i) => {
            const d = profileData[name] || {
              taste: "",
              diet: "",
              limits: [],
              allergens: [],
            };
            return (
              <button
                type="button"
                className="profile-row"
                key={name}
                onClick={() => openDiet(name)}
              >
                <div className="profile-card-head">
                  <strong>{name}</strong>
                  <em className="profile-tag">
                    {i === 0 ? "主用户" : i === 1 ? "伴侣" : "父母"}
                  </em>
                  <b>›</b>
                </div>
                <span className="profile-detail">
                  <strong>口味偏好：</strong>
                  {[d.taste, d.diet].filter(Boolean).join("、") || "未设置"}
                </span>
                <span className="profile-detail">
                  <strong>长期忌口：</strong>
                  {d.limits.join("、") || "无"}
                </span>
              </button>
            );
          })}
        </div>
      </section>
      <button
        className="danger-link logout"
        onClick={() => setDialog("确定要退出登录吗？")}
      >
        退出登录
      </button>
    </>
  );
}
