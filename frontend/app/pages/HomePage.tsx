"use client";
import "../styles/pages/home.css";
import { useApp } from "../context/AppContext";
import { Header } from "../components/Header";
import { Placeholder } from "../components/Placeholder";

export function HomePage() {
  const { foods, go, setDialog, openRecipes } = useApp();
  return (
    <>
      <Header title="今天吃什么？" sub="看看家里有什么，再帮你挑一道刚刚好的。" />
      <section className="home-feature">
        <div className="feature-motion">
          <span>动态大图占位</span>
          <i />
          <i />
          <i />
        </div>
        <div className="feature-copy">
          <strong>今天的一餐，从家里有什么开始。</strong>
          <small>此区域预留给后续动态视觉素材</small>
        </div>
      </section>
      <div className="home-entries">
        <button type="button" onClick={() => go("fridge")}>
          <Placeholder kind="icon" />
          <span>
            <strong>打开冰箱</strong>
            <small>查看和管理家里的食材</small>
          </span>
          <b>›</b>
        </button>
        <button
          type="button"
          className="featured"
          onClick={() =>
            foods.length ? go("needs") : setDialog("冰箱里还没记东西呢")
          }
        >
          <Placeholder kind="icon" />
          <span>
            <strong>帮我决定</strong>
            <small>根据这一顿的需求帮你挑</small>
          </span>
          <b>›</b>
        </button>
        <button type="button" onClick={() => openRecipes("done")}>
          <Placeholder kind="icon" />
          <span>
            <strong>我的菜谱</strong>
            <small>查看做过和喜欢的菜谱</small>
          </span>
          <b>›</b>
        </button>
      </div>
    </>
  );
}
