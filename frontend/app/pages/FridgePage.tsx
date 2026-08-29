"use client";
import { useEffect, useMemo, useState } from "react";
import "../styles/pages/fridge.css";
import "../styles/components/food-modal.css";
import { useApp } from "../context/AppContext";
import { ExpiryTag } from "../components/ExpiryTag";
import { Field } from "../components/Field";
import { Header } from "../components/Header";
import { Placeholder } from "../components/Placeholder";
import { inventoryService, type InventorySnapshot } from "../services/inventoryService";
import type { Food } from "../lib/types";
import type { Ingredient } from "../types/domain";

const placeByKey = { fridge: "冷藏", freezer: "冷冻", pantry: "常温" } as const;
const keyByPlace = { 冷藏: "fridge", 冷冻: "freezer", 常温: "pantry" } as const;

function daysUntil(expiryDate: string | null): number {
  if (!expiryDate) return 0;
  return Math.max(0, Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86_400_000));
}

function toFood(item: Ingredient, snapshot: InventorySnapshot): Food {
  const location = snapshot.locations.find((entry) => entry.id === item.locationId);
  const unit = snapshot.unitTypes.find((entry) => entry.id === item.unitTypeId);
  return {
    id: item.id,
    name: item.name,
    qty: item.quantity,
    unit: unit?.name ?? "个",
    place: location ? placeByKey[location.key] : "冷藏",
    days: daysUntil(item.expiryDate),
    normalizedName: item.normalizedName,
    unitTypeId: item.unitTypeId,
    locationId: item.locationId,
    expiryDate: item.expiryDate,
    imageFileId: item.imageFileId,
    source: item.source,
    createdDate: item.createdDate,
    updatedDate: item.updatedDate,
  };
}

export function FridgePage() {
  const {
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
    setDialog,
    say,
  } = useApp();
  const [snapshot, setSnapshot] = useState<InventorySnapshot | null>(null);
  const [inventoryFoods, setInventoryFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [saving, setSaving] = useState(false);
  const locationsByKey = useMemo(
    () => Object.fromEntries((snapshot?.locations ?? []).map((location) => [location.key, location.id])),
    [snapshot],
  );
  const unitsByName = useMemo(
    () => Object.fromEntries((snapshot?.unitTypes ?? []).map((unit) => [unit.name, unit.id])),
    [snapshot],
  );

  useEffect(() => {
    let active = true;
    inventoryService.list()
      .then((data) => {
        if (!active) return;
        setSnapshot(data);
        const nextFoods = data.items.map((item) => toFood(item, data));
        setInventoryFoods(nextFoods);
        setFoods(nextFoods);
        setApiError("");
      })
      .catch((error: unknown) => {
        if (!active) return;
        const message = error instanceof Error ? error.message : "库存加载失败";
        setApiError(message);
        say(`库存加载失败：${message}`);
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
    // AppContext action identities are not stable yet; inventory is loaded once per page mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveFood = async () => {
    const locationKey = keyByPlace[newFood.place as keyof typeof keyByPlace];
    const locationId = locationsByKey[locationKey];
    const unitTypeId = unitsByName[newFood.unit];
    if (!locationId || !unitTypeId) {
      say("库存基础数据不完整，请刷新后重试");
      return;
    }
    setSaving(true);
    try {
      const input = {
        name: newFood.name.trim(),
        normalizedName: newFood.normalizedName ?? newFood.name.trim(),
        quantity: Number(newFood.qty),
        unitTypeId,
        locationId,
        expiryDate: new Date(Date.now() + newFood.days * 86_400_000).toISOString(),
        imageFileId: newFood.imageFileId ?? null,
        source: newFood.source ?? "manual" as const,
      };
      const saved = foodModal === "add"
        ? await inventoryService.create(input)
        : await inventoryService.update(newFood.id!, input);
      const nextSnapshot = { ...snapshot!, items: foodModal === "add"
        ? [...snapshot!.items, saved]
        : snapshot!.items.map((item) => item.id === saved.id ? saved : item) };
      setSnapshot(nextSnapshot);
      const nextFoods = nextSnapshot.items.map((item) => toFood(item, nextSnapshot));
      setInventoryFoods(nextFoods);
      setFoods(nextFoods);
      setFoodModal(null);
      say(foodModal === "add" ? "食材已添加" : "已保存修改");
    } catch (error) {
      say(`保存失败：${error instanceof Error ? error.message : "请稍后重试"}`);
    } finally {
      setSaving(false);
    }
  };
  const all = inventoryFoods.filter((f) => f.place === fridgePlace),
    totalPages = Math.max(1, Math.ceil(all.length / 20)),
    visible = all.slice(fridgePage * 20, fridgePage * 20 + 20),
    selected = foodModal === "add" || foodModal === "edit" ? newFood : inventoryFoods[editIndex];
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
              <small>{inventoryFoods.filter((f) => f.place === place).length} 种</small>
            </button>
          ))}
        </div>
        <button className="storage-add" disabled={loading || !snapshot} onClick={() => {
          setNewFood({ name: "", qty: 1, unit: "个", place: fridgePlace, days: 3 });
          setFoodModal("add");
        }}>
          ＋ 添加食材
        </button>
      </div>
      <section className="storage-pane">
        <div className="storage-heading">
          <h2>{fridgePlace}</h2>
        </div>
        {loading ? (
          <div className="empty">库存加载中……</div>
        ) : apiError ? (
          <div className="empty">库存加载失败，请稍后重试</div>
        ) : visible.length ? (
          <div className="inventory-grid">
            {visible.map((f) => {
              const i = inventoryFoods.indexOf(f);
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
        disabled={loading || !snapshot}
        onClick={() => {
          setNewFood({ name: "", qty: 1, unit: "个", place: fridgePlace, days: 3 });
          setFoodModal("add");
        }}
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
                  <button onClick={() => {
                    setNewFood({ ...selected });
                    setFoodModal("edit");
                  }}>
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
                  onChange={setNewFood}
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
                    disabled={!selected.name.trim() || saving}
                    onClick={saveFood}
                  >
                    {saving ? "保存中……" : foodModal === "add" ? "保存" : "保存修改"}
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
