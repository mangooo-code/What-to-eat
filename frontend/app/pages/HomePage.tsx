"use client";
import "../styles/pages/home.css";
import { useApp } from "../context/AppContext";
import { Header } from "../components/Header";
import { AssetImage } from "../components/AssetImage";

export function HomePage() {
  const { foods, go, setDialog, openRecipes } = useApp();
  return (
    <>
      <Header title="今天想吃点什么？" sub="看看家里有什么，我来帮你挑。" />
      <section className="home-feature">
        <div className="feature-motion">
          <AssetImage name="home-hero.png" alt="开饭猫准备今天的一餐" className="home-hero-image" />
        </div>
        <div className="feature-copy">
          <strong>今天这顿，就从冰箱里找找灵感吧。</strong>
          <small>不用想吃什么，我来帮你挑。</small>
        </div>
      </section>
      <div className="home-entries">
        <button type="button" onClick={() => go("fridge")}>
          <AssetImage name="open-fridge.png" alt="打开冰箱" />
          <span>
            <strong>打开冰箱</strong>
            <small>看看家里还有什么</small>
          </span>
          <b>›</b>
        </button>
        <button
          type="button"
          className="featured"
          onClick={() =>
            foods.length ? go("needs") : setDialog("冰箱还是空空的，先放点食材进来吧。")
          }
        >
          <AssetImage name="help-me-decide.png" alt="帮我决定" />
          <span>
            <strong>帮我决定</strong>
            <small>告诉我这顿想怎么吃</small>
          </span>
          <b>›</b>
        </button>
        <button type="button" onClick={() => openRecipes("done")}>
          <AssetImage name="my-recipes.png" alt="我的菜谱" />
          <span>
            <strong>我的菜谱</strong>
            <small>看看我们以前吃过什么</small>
          </span>
          <b>›</b>
        </button>
      </div>
    </>
  );
}
