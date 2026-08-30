"use client";
import "../styles/pages/confirm.css";
import "../styles/components/food-modal.css";
import { useApp } from "../context/AppContext";
import { Field } from "../components/Field";
import { Header } from "../components/Header";
import { FoodEmoji } from "../components/FoodEmoji";

export function ConfirmPage() {
  const {
    foods,
    setFoods,
    confirmEdit,
    setConfirmEdit,
    newFood,
    setNewFood,
    go,
    say,
  } = useApp();
  const editing =
    confirmEdit === -1
      ? newFood
      : confirmEdit !== null
        ? foods[confirmEdit]
        : null;
  return (
    <>
      <Header
        title="这些食材对吗？"
        sub="我先整理了一遍，有不对的地方可以直接修改。"
        back={() => go("capture")}
      />
      <div className="confirm-list">
        {foods.map((f, i) => (
          <article className="confirm-item" key={`${f.name}${i}`}>
            <FoodEmoji name={f.name} />
            <span>
              <strong>{f.name || "未命名食材"}</strong>
              <small>
                {f.qty} {f.unit} · {f.place} · {f.days} 天后过期
              </small>
            </span>
            <button
              className="confirm-edit-button"
              onClick={() => setConfirmEdit(i)}
            >
              修改
            </button>
          </article>
        ))}
      </div>
      <button
        className="add-row"
        onClick={() => {
          setNewFood({ name: "", qty: 1, unit: "个", place: "冷藏", days: 3 });
          setConfirmEdit(-1);
        }}
      >
        ＋ 添加食材
      </button>
      <button
        className="primary sticky"
        onClick={() => {
          say("食材已经添加到冰箱");
          go("fridge");
        }}
      >
        确认添加
      </button>
      {editing && (
        <div className="overlay">
          <div className="food-modal">
            <button
              className="modal-close"
              onClick={() => setConfirmEdit(null)}
            >
              ×
            </button>
            <h2>{confirmEdit === -1 ? "新增食材信息" : "编辑食材信息"}</h2>
            <Field
              food={editing}
              onChange={(f) =>
                confirmEdit === -1
                  ? setNewFood(f)
                  : setFoods((a) =>
                      a.map((x, i) => (i === confirmEdit ? f : x)),
                    )
              }
            />
            <div className="modal-edit-actions">
              <button onClick={() => setConfirmEdit(null)}>取消</button>
              {confirmEdit !== -1 && (
                <button
                  className="danger-link"
                  onClick={() => {
                    setFoods((a) => a.filter((_, i) => i !== confirmEdit));
                    setConfirmEdit(null);
                  }}
                >
                  删除
                </button>
              )}
              <button
                className="primary"
                disabled={!editing.name.trim()}
                onClick={() => {
                  if (confirmEdit === -1) setFoods((a) => [...a, newFood]);
                  setConfirmEdit(null);
                  say(confirmEdit === -1 ? "食材已添加" : "修改已保存");
                }}
              >
                {confirmEdit === -1 ? "保存" : "保存修改"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
