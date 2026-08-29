"use client";
import "../styles/pages/needs.css";
import { useApp } from "../context/AppContext";
import { Header } from "../components/Header";
import { ProfileForm } from "../components/ProfileForm";

export function MemberPage() {
  const {
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
    go,
  } = useApp();
  return (
    <>
      <Header title="添加一起吃饭的人" back={() => go("needs")} />
      <label className="label">
        姓名 / 昵称
        <input
          value={newMemberName}
          onChange={(e) => setNewMemberName(e.target.value)}
          placeholder="输入姓名或昵称"
        />
      </label>
      <section className="block">
        <h2>关系</h2>
        <div className="chips relation-options">
          {["伴侣", "家人", "朋友", "其他"].map((x) => (
            <button
              className={relation === x ? "active" : ""}
              onClick={() => setRelation(x)}
              key={x}
            >
              {x}
            </button>
          ))}
        </div>
      </section>
      <ProfileForm
        value={{ taste: draftTaste, diet: draftDiet, limits: draftLimits, allergens: draftAllergens }}
        onChange={(data) => {
          setDraftTaste(data.taste);
          setDraftDiet(data.diet);
          setDraftLimits(data.limits);
          setDraftAllergens(data.allergens);
        }}
      />
      <button
        className="primary sticky"
        disabled={!newMemberName.trim() || !relation || memberSaving}
        onClick={async () => {
          if (await saveMember()) go("needs");
        }}
      >
        {memberSaving ? "保存中……" : "保存"}
      </button>
    </>
  );
}
