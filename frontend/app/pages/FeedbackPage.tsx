"use client";
import "../styles/pages/feedback.css";
import { useApp } from "../context/AppContext";
import { Header } from "../components/Header";
import { Placeholder } from "../components/Placeholder";

export function FeedbackPage() {
  const {
    mealReaction,
    setMealReaction,
    liked,
    setLiked,
    success,
    setSuccess,
    go,
  } = useApp();
  return (
    <>
      <Header title="吃起来怎么样？" sub="随手记一下，下次会更懂你的口味。" />
      <section className="block">
        <h2>这道菜你觉得怎么样？</h2>
        <div className="reaction-options">
          {["好吃！", "一般", "不喜欢"].map((x) => (
            <button
              className={mealReaction === x ? "active" : ""}
              key={x}
              onClick={() => setMealReaction(x)}
            >
              <Placeholder />
              <strong>{x}</strong>
            </button>
          ))}
        </div>
      </section>
      <label className="label">
        还有什么想说的？
        <textarea placeholder="很好吃，就是有点甜……" />
      </label>
      <button className="heart big" onClick={() => setLiked(!liked)}>
        {liked ? "♥ 已加入喜欢" : "♡ 加入喜欢"}
      </button>
      <button
        className="primary sticky"
        onClick={() => {
          setSuccess(true);
          setTimeout(() => {
            setSuccess(false);
            go("home");
          }, 2000);
        }}
      >
        完成
      </button>
      {success && (
        <div className="success-state">
          <b>✓</b>
          <h2>记住啦，下次继续帮你挑合适的。</h2>
        </div>
      )}
    </>
  );
}
