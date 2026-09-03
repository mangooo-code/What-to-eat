"use client";
import "../styles/pages/feedback.css";
import { useApp } from "../context/AppContext";
import { Header } from "../components/Header";
import { AssetImage } from "../components/AssetImage";

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
              type="button"
              className={mealReaction === x ? "active" : ""}
              aria-pressed={mealReaction === x}
              key={x}
              onClick={() => setMealReaction(x)}
            >
              <AssetImage
                name={x === "好吃！" ? "delicious.png" : x === "一般" ? "average.png" : "dislike.png"}
                alt=""
              />
              <strong>{x}</strong>
            </button>
          ))}
        </div>
      </section>
      <label className="label feedback-comment-field">
        还有什么想说的？
        <textarea placeholder="很好吃，就是有点甜……" />
      </label>
      <button className="heart big" type="button" aria-pressed={liked} onClick={() => setLiked(!liked)}>
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
          <AssetImage name="got-it.png" alt="" className="asset-state" />
          <h2>记住啦，下次继续帮你挑合适的。</h2>
        </div>
      )}
    </>
  );
}
