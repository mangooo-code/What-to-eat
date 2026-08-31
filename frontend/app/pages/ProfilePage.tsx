"use client";
import "../styles/pages/profile.css";
import { useApp } from "../context/AppContext";
import { Header } from "../components/Header";
import { AssetImage } from "../components/AssetImage";

export function ProfilePage() {
  const { householdMembers, membersLoading, currentUser, openRecipes, openMember, openDiet, setDialog } =
    useApp();
  return (
    <>
      <Header title="我的" />
      <div className="person">
        <AssetImage name="default-avatar.png" alt="默认头像" className="profile-avatar" />
        <div>
          <h2>
            {currentUser?.displayName || "我"} <span className="profile-tag">主用户</span>
          </h2>
          <p>{currentUser?.phoneNumber ?? ""}</p>
          <small>ID：{currentUser?.id ?? ""}</small>
        </div>
      </div>
      <section className="block recipe-shortcuts">
        <h2>我的菜谱</h2>
        <div>
          <button type="button" onClick={() => openRecipes("done")}>
            <AssetImage name="recipe-history.png" alt="历史菜谱" />
            <span>
              <strong>历史菜谱</strong>
              <small>8 条做饭记录</small>
            </span>
            <b>›</b>
          </button>
          <button type="button" onClick={() => openRecipes("liked")}>
            <AssetImage name="favorite-recipes.png" alt="喜欢的菜谱" />
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
          {membersLoading && <div className="inline-state"><AssetImage name="general-loading.png" alt="" className="asset-state" /><p>成员加载中……</p></div>}
          {householdMembers.map((member) => {
            return (
              <button
                type="button"
                className="profile-row"
                key={member.memberId}
                onClick={() => openDiet(member.memberId)}
              >
                <div className="profile-card-head">
                  <strong>{member.name}</strong>
                  <em className="profile-tag">
                    {member.isOwner ? "主用户" : member.relationship}
                  </em>
                  <b>›</b>
                </div>
                <span className="profile-detail">
                  <strong>口味偏好：</strong>
                  {[member.tastePreference, member.dietPreference].filter(Boolean).join("、") || "未设置"}
                </span>
                <span className="profile-detail">
                  <strong>长期忌口：</strong>
                  {member.dietaryRestrictions.join("、") || "无"}
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
