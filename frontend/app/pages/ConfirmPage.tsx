"use client";
import { useState } from "react";
import "../styles/pages/confirm.css";
import "../styles/components/food-modal.css";
import { useApp } from "../context/AppContext";
import { Field } from "../components/Field";
import { Header } from "../components/Header";
import { FoodEmoji } from "../components/FoodEmoji";
import { inventoryService } from "../services/inventoryService";

const keyByPlace = { 冷藏: "fridge", 冷冻: "freezer", 常温: "pantry" } as const;

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
    fridgePlace,
  } = useApp();
  const [saving, setSaving] = useState(false);
  const [expiryEditor, setExpiryEditor] = useState<number | null>(null);
  const [customExpiryEditor, setCustomExpiryEditor] = useState<number | null>(null);
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
            <span className="confirm-food-details">
              <strong>{f.name || "未命名食材"}</strong>
              <small>
                {f.qty} {f.unit}
                {f.days !== null && f.days > 0 && (
                  <button
                    type="button"
                    className="confirm-expiry-value"
                    onClick={() => {
                      setExpiryEditor(i);
                      setCustomExpiryEditor(null);
                    }}
                  >
                    · {f.days}天后过期
                  </button>
                )}
              </small>
              {f.days === null && expiryEditor !== i && (
                <button
                  type="button"
                  className="confirm-expiry-add"
                  onClick={() => {
                    setExpiryEditor(i);
                    setCustomExpiryEditor(null);
                  }}
                >
                  + 添加过期时间
                </button>
              )}
            </span>
            <button
              className="confirm-edit-button"
              onClick={() => setConfirmEdit(i)}
            >
              修改
            </button>
            {expiryEditor === i && (
              <div className="confirm-expiry-editor">
                <div className="confirm-expiry-options">
                  {[3, 7, 14].map((days) => (
                    <button
                      type="button"
                      key={days}
                      onClick={() => {
                        setFoods((items) => items.map((item, index) => index === i ? { ...item, days } : item));
                        setExpiryEditor(null);
                        setCustomExpiryEditor(null);
                      }}
                    >
                      {days}天后
                    </button>
                  ))}
                  <button type="button" onClick={() => setCustomExpiryEditor(i)}>自定义</button>
                  <button
                    type="button"
                    onClick={() => {
                      setFoods((items) => items.map((item, index) => index === i ? { ...item, days: null } : item));
                      setExpiryEditor(null);
                      setCustomExpiryEditor(null);
                    }}
                  >
                    暂不设置
                  </button>
                </div>
                {customExpiryEditor === i && (
                  <span className="confirm-custom-expiry">
                    <input
                      aria-label={`${f.name}自定义过期天数`}
                      type="number"
                      min="1"
                      step="1"
                      inputMode="numeric"
                      value={f.days !== null && f.days > 0 ? f.days : 1}
                      onChange={(event) => {
                        const days = Math.max(1, Math.floor(Number(event.target.value) || 1));
                        setFoods((items) => items.map((item, index) => index === i ? { ...item, days } : item));
                      }}
                    />
                    <b>天后过期</b>
                    <button
                      type="button"
                      onClick={() => {
                        setExpiryEditor(null);
                        setCustomExpiryEditor(null);
                      }}
                    >
                      完成
                    </button>
                  </span>
                )}
              </div>
            )}
          </article>
        ))}
      </div>
      <button
        className="add-row"
        onClick={() => {
          setNewFood({ name: "", qty: 1, unit: "个", place: fridgePlace, days: null, source: "recognition" });
          setConfirmEdit(-1);
        }}
      >
        ＋ 添加食材
      </button>
      <button
        className="primary sticky"
        disabled={!foods.length || saving}
        onClick={async () => {
          setSaving(true);
          try {
            const snapshot = await inventoryService.list();
            const locationKey = keyByPlace[fridgePlace as keyof typeof keyByPlace];
            const locationId = snapshot.locations.find((item) => item.key === locationKey)?.id;
            if (!locationId) throw new Error("找不到当前存放区域");
            await Promise.all(foods.map((food) => {
              const unitTypeId = snapshot.unitTypes.find((item) => item.name === food.unit)?.id;
              if (!unitTypeId) throw new Error(`找不到“${food.unit}”对应的单位`);
              return inventoryService.create({
                name: food.name.trim(),
                normalizedName: food.normalizedName ?? food.name.trim(),
                quantity: Number(food.qty),
                unitTypeId,
                locationId,
                expiryDate: food.days !== null && food.days > 0
                  ? new Date(Date.now() + food.days * 86_400_000).toISOString()
                  : null,
                imageFileId: food.imageFileId ?? null,
                source: "recognition",
              });
            }));
            say(`食材已经添加到${fridgePlace}`);
            go("fridge");
          } catch (error) {
            say(`添加失败：${error instanceof Error ? error.message : "请稍后重试"}`);
          } finally {
            setSaving(false);
          }
        }}
      >
        {saving ? "添加中……" : "确认添加"}
      </button>
      {editing && (
        <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-edit-title">
          <div className="food-modal">
            <button
              className="modal-close"
              aria-label="关闭"
              onClick={() => setConfirmEdit(null)}
            >
              ×
            </button>
            <h2 id="confirm-edit-title">{confirmEdit === -1 ? "新增食材信息" : "编辑食材信息"}</h2>
            <Field
              food={editing}
              showExpiry={confirmEdit === -1}
              showPlace={false}
              useOptionalExpiry={confirmEdit === -1}
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
