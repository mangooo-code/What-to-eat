"use client";
import "../styles/components/profile-form.css";
import { useState } from "react";
import type { ProfileData } from "../lib/types";
import { EditableMulti } from "./EditableMulti";
import { Single } from "./Single";

export function ProfileForm({
  value,
  onChange,
}: {
  value?: ProfileData;
  onChange?: (d: ProfileData) => void;
}) {
  const [local, setLocal] = useState<ProfileData>({
    taste: "",
    diet: "",
    limits: [],
    allergens: [],
  });
  const data = value || local,
    change = (next: ProfileData) => {
      onChange ? onChange(next) : setLocal(next);
    };
  return (
    <div className="profile-form">
      <Single
        title="平时喜欢什么口味？"
        opts={["清淡", "家常", "香辣", "酸口", "甜口"]}
        selected={data.taste}
        onSelect={(taste) => change({ ...data, taste })}
      />
      <Single
        title="平时的饮食倾向"
        opts={["高蛋白", "低脂", "素食"]}
        selected={data.diet}
        onSelect={(diet) => change({ ...data, diet })}
      />
      <EditableMulti
        title="长期不吃的食物"
        opts={[
          "不吃辣",
          "不吃香菜",
          "不吃葱",
          "不吃姜",
          "不吃蒜",
          "不吃动物内脏",
          "不吃生食",
          "不吃菌菇",
          "不吃牛肉",
          "不吃羊肉",
          "不吃海鲜",
        ]}
        selected={data.limits}
        onSelect={(limits) => change({ ...data, limits })}
      />
      <EditableMulti
        title="过敏原"
        opts={[
          "花生",
          "坚果",
          "牛奶 / 乳制品",
          "鸡蛋",
          "小麦 / 麸质",
          "大豆",
          "鱼类",
          "甲壳类 / 贝类",
          "无已知过敏原",
        ]}
        selected={data.allergens}
        onSelect={(allergens) => change({ ...data, allergens })}
        allergy
      />
      <p className="notice">过敏信息会优先用于每一次菜谱推荐。</p>
    </div>
  );
}
