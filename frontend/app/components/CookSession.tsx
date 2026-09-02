"use client";
import "../styles/pages/cook.css";
import { Consume } from "./Consume";
import { Header } from "./Header";

export function CookSession({
  title,
  sub,
  back,
  showOtherRecipesLink,
  onOtherRecipesClick,
  consumeOpen,
  onStartConsume,
  onCloseConsume,
  onEndCooking,
  onConsumeDone,
}: {
  title: string;
  sub: string;
  back: () => void;
  showOtherRecipesLink: boolean;
  onOtherRecipesClick: () => void;
  consumeOpen: boolean;
  onStartConsume: () => void;
  onCloseConsume: () => void;
  onEndCooking: () => void;
  onConsumeDone: (tomato: number, egg: number) => void;
}) {
  return (
    <>
      <Header title={title} sub={sub} back={back} />
      {showOtherRecipesLink && (
        <button className="link cook-back" onClick={onOtherRecipesClick}>
          ‹ 看看其他菜谱
        </button>
      )}
      <div className="sticky-actions">
        <button className="primary" onClick={onStartConsume}>
          做好啦
        </button>
        <button className="danger-link" onClick={onEndCooking}>
          结束制作
        </button>
      </div>
      {consumeOpen && (
        <div className="overlay" role="dialog" aria-modal="true" aria-label="确认食材消耗">
          <div className="consume-modal">
            <button
              className="modal-close"
              aria-label="关闭"
              onClick={onCloseConsume}
            >
              ×
            </button>
            <Consume onDone={onConsumeDone} />
          </div>
        </div>
      )}
    </>
  );
}
