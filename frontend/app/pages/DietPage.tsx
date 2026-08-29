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
    setPeople,
    setMembers,
    setProfileData,
    say,
    go,
  } = useApp();
  return (
    <>
      <Header
        title={
          draftProfileName === "我"
            ? "我的饮食档案"
            : `${draftProfileName}的饮食档案`
        }
        back={() => go("profile")}
      />
      {profileName !== "我" && (
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
        disabled={!draftProfileName.trim()}
        onClick={() => {
          const next = draftProfileName.trim();
          setPeople((a) => a.map((x) => (x === profileName ? next : x)));
          setMembers((a) => a.map((x) => (x === profileName ? next : x)));
          setProfileData((a) => {
            const copy = { ...a };
            delete copy[profileName];
            copy[next] = {
              taste: draftTaste,
              diet: draftDiet,
              limits: draftLimits,
              allergens: draftAllergens,
            };
            return copy;
          });
          setProfileName(next);
          say("档案已保存");
          go("profile");
        }}
      >
        保存
      </button>
      {profileName !== "我" && (
        <button
          className="danger-link"
          onClick={() => {
            setPeople((a) => a.filter((x) => x !== profileName));
            setMembers((a) => a.filter((x) => x !== profileName));
            go("profile");
          }}
        >
          删除成员
        </button>
      )}
    </>
  );
}
