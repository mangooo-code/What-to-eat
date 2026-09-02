"use client";
import "../styles/pages/diet.css";
import { useApp } from "../context/AppContext";
import { Header } from "../components/Header";
import { ProfileForm } from "../components/ProfileForm";

export function DietPage() {
  const {
    draftProfileName,
    setDraftProfileName,
    profileName,
    setProfileName,
    draftTaste,
    setDraftTaste,
    draftDiet,
    setDraftDiet,
    draftLimits,
    setDraftLimits,
    draftAllergens,
    setDraftAllergens,
    householdMembers,
    profileMemberId,
    memberSaving,
    saveDietProfile,
    deleteProfileMember,
    go,
    goBack,
  } = useApp();
  const activeMember = householdMembers.find((member) => member.memberId === profileMemberId);
  return (
    <>
      <Header
        title={
          activeMember?.isOwner
            ? "我的饮食档案"
            : `${draftProfileName}的饮食档案`
        }
        back={() => goBack()}
      />
      {!activeMember?.isOwner && (
        <label className="label profile-name">
          成员姓名
          <input
            value={draftProfileName}
            onChange={(e) => setDraftProfileName(e.target.value)}
            placeholder="输入成员姓名"
          />
        </label>
      )}
      <ProfileForm
        value={{
          taste: draftTaste,
          diet: draftDiet,
          limits: draftLimits,
          allergens: draftAllergens,
        }}
        onChange={(d) => {
          setDraftTaste(d.taste);
          setDraftDiet(d.diet);
          setDraftLimits(d.limits);
          setDraftAllergens(d.allergens);
        }}
      />
      <button
        className="primary sticky"
        disabled={!draftProfileName.trim() || memberSaving}
        onClick={saveDietProfile}
      >
        {memberSaving ? "保存中……" : "保存"}
      </button>
      {!activeMember?.isOwner && (
        <button
          className="danger-link"
          disabled={memberSaving}
          onClick={deleteProfileMember}
        >
          删除成员
        </button>
      )}
    </>
  );
}
