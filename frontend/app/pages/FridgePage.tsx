"use client";
import "../styles/pages/fridge.css";
import "../styles/components/food-modal.css";
import { useApp } from "../context/AppContext";
import { ExpiryTag } from "../components/ExpiryTag";
import { Field } from "../components/Field";
import { Header } from "../components/Header";
import { Placeholder } from "../components/Placeholder";

export function FridgePage() {
  const {
    foods,
    setFoods,
    fridgePlace,
    setFridgePlace,
    fridgePage,
    setFridgePage,
    editIndex,
    setEditIndex,
    foodModal,
    setFoodModal,
    newFood,
    setNewFood,
    go,
    setDialog,
    say,
  } = useApp();
  const all = foods.filter((f) => f.place === fridgePlace),
    totalPages = Math.max(1, Math.ceil(all.length / 20)),
    visible = all.slice(fridgePage * 20, fridgePage * 20 + 20),
    selected = foodModal === "add" ? newFood : foods[editIndex];
  return (
    <>
      <Header
        title="家里还有这些"
        sub="冷藏、冷冻和常温分开维护，找起来更清楚。"
      />
      <div className="storage-toolbar">
        <div className="storage-tabs">
          {["冷藏", "冷冻", "常温"].map((place) => (
            <button
              className={fridgePlace === place ? "active" : ""}
              key={place}
              onClick={() => {
                setFridgePlace(place);
                setFridgePage(0);
              }}
            >
              <strong>{place}</strong>
              <small>{foods.filter((f) => f.place === place).length} 种</small>
            </button>
          ))}
        </div>
        <button className="storage-add" onClick={() => go("capture")}>
          ＋ 添加食材
        </button>
      </div>
      <section className="storage-pane">
        <div className="storage-heading">
          <h2>{fridgePlace}</h2>
        </div>
        {visible.length ? (
          <div className="inventory-grid">
            {visible.map((f) => {
              const i = foods.indexOf(f);
              return (
                <button
                  className="food-tile"
                  key={`${f.name}-${i}`}
                  onClick={() => {
                    setEditIndex(i);
                    setFoodModal("summary");
                  }}
                >
                  <Placeholder />
                  <span>
                    <strong>{f.name}</strong>
                    <small>
                      {f.qty} {f.unit}
                    </small>
                  </span>
                  <ExpiryTag days={f.days} />
                </button>
              );
            })}
          </div>
        ) : (
          <div className="empty">这里还没有食材</div>
        )}
        <div className="pagination">
          <button
            aria-label="上一页"
            disabled={fridgePage === 0}
            onClick={() => setFridgePage((x) => x - 1)}
          >
            ‹
          </button>
          <span>
            {fridgePage + 1} / {totalPages}
          </span>
          <button
            aria-label="下一页"
            disabled={fridgePage >= totalPages - 1}
            onClick={() => setFridgePage((x) => x + 1)}
          >
            ›
          </button>
        </div>
      </section>
      <button
        className="fab"
        data-tip="添加一些食材吧～"
        aria-label="添加食材"
        onClick={() => go("capture")}
      >
        ＋
      </button>
      {foodModal && selected && (
        <div className="overlay">
          <div className="food-modal">
            {foodModal === "summary" ? (
              <>
                <button
                  className="modal-close"
                  onClick={() => setFoodModal(null)}
                >
                  ×
                </button>
                <div className="modal-food-title">
                  <Placeholder />
                  <span>
                    <h2>{selected.name}</h2>
                    <p>存放于：{selected.place}</p>
                  </span>
                </div>
                <div className="stock-summary">
                  <span>
                    当前库存量：
                    <b>
                      {selected.qty} {selected.unit}
                    </b>
                  </span>
                  <span>
                    过期状态：
                    <ExpiryTag days={selected.days} />
                  </span>
                </div>
                <div className="modal-actions">
                  <button onClick={() => setFoodModal("edit")}>
                    <Placeholder kind="icon" />
                    编辑信息
                  </button>
                  <button
                    onClick={() => {
                      setFoodModal(null);
                      setDialog("删除这项食材？");
                    }}
                  >
                    <Placeholder kind="icon" />
                    移除食材
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2>{foodModal === "add" ? "新增食材信息" : "编辑食材信息"}</h2>
                <Field
                  food={selected}
                  onChange={(f) =>
                    foodModal === "add"
                      ? setNewFood(f)
                      : setFoods((a) =>
                          a.map((x, i) => (i === editIndex ? f : x)),
                        )
                  }
                />
                <div className="modal-edit-actions">
                  <button
                    onClick={() =>
                      setFoodModal(foodModal === "add" ? null : "summary")
                    }
                  >
                    取消
                  </button>
                  <button
                    className="primary"
                    disabled={!selected.name.trim()}
                    onClick={() => {
                      if (foodModal === "add")
                        setFoods((a) => [...a, newFood]);
                      setFoodModal(null);
                      say(foodModal === "add" ? "食材已添加" : "已保存修改");
                    }}
                  >
                    {foodModal === "add" ? "保存" : "保存修改"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
