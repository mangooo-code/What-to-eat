"use client";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import "../styles/pages/fridge.css";
import "../styles/components/food-modal.css";
import { useApp } from "../context/AppContext";
import { ExpiryTag } from "../components/ExpiryTag";
import { Field } from "../components/Field";
import { Header } from "../components/Header";
import { AssetImage } from "../components/AssetImage";
import { FoodEmoji } from "../components/FoodEmoji";
import { inventoryService, type InventorySnapshot } from "../services/inventoryService";
import type { Food } from "../lib/types";
import type { Ingredient } from "../types/domain";

const placeByKey = { fridge: "冷藏", freezer: "冷冻", pantry: "常温" } as const;
const keyByPlace = { 冷藏: "fridge", 冷冻: "freezer", 常温: "pantry" } as const;
const tabIconByPlace = { 冷藏: "open-fridge.png", 冷冻: "refrigerator.png", 常温: "pantry.png" } as const;
const backgroundByPlace = { 冷藏: "refrigerator-background.png", 冷冻: "freezer-background.png", 常温: "pantry-background.png" } as const;

function daysUntil(expiryDate: string | null): number {
  if (!expiryDate) return 0;
  return Math.max(0, Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86_400_000));
}

const FOOD_NAME_CHAR_LIMIT = 8;
const PAGE_SIZE = 10;

function truncateFoodName(name: string): string {
  return [...name].length > FOOD_NAME_CHAR_LIMIT
    ? `${[...name].slice(0, FOOD_NAME_CHAR_LIMIT).join("")}...`
    : name;
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
    foods,
    setFoods,
    fridgePlace,
    setFridgePlace,
    editIndex,
    setEditIndex,
    foodModal,
    setFoodModal,
    newFood,
    setNewFood,
    setDialog,
    say,
    go,
  } = useApp();
  const [snapshot, setSnapshot] = useState<InventorySnapshot | null>(null);
  const [inventoryFoods, setInventoryFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [saving, setSaving] = useState(false);
  const [addChoiceOpen, setAddChoiceOpen] = useState(false);
  const [pagesByPlace, setPagesByPlace] = useState<Record<string, number>>({
    冷藏: 0,
    冷冻: 0,
    常温: 0,
  });
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

  useEffect(() => {
    if (!loading && snapshot) setInventoryFoods(foods);
  }, [foods, loading, snapshot]);

  const saveFood = async () => {
    const locationKey = keyByPlace[newFood.place as keyof typeof keyByPlace];
    const locationId = locationsByKey[locationKey];
    const unitTypeId = unitsByName[newFood.unit];
    if (!locationId || !unitTypeId) {
      say("食材信息加载出了点问题，请刷新后重试。");
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
        expiryDate: foodModal === "add" && newFood.days === 0
          ? null
          : new Date(Date.now() + newFood.days * 86_400_000).toISOString(),
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
    totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE)),
    currentPage = Math.min(pagesByPlace[fridgePlace] ?? 0, totalPages - 1),
    visible = all.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE),
    selected = foodModal === "add" || foodModal === "edit" ? newFood : inventoryFoods[editIndex];

  useEffect(() => {
    setPagesByPlace((pages) =>
      pages[fridgePlace] === currentPage
        ? pages
        : { ...pages, [fridgePlace]: currentPage },
    );
  }, [currentPage, fridgePlace]);
  return (
    <>
      <Header
        title="家里还有什么？"
        sub="家里的食材，都帮你整理在这里啦。"
      />
      <div className="storage-toolbar">
        <div className="storage-tabs" role="tablist">
          {["冷藏", "冷冻", "常温"].map((place) => (
            <button
              type="button"
              role="tab"
              aria-selected={fridgePlace === place}
              className={fridgePlace === place ? "active" : ""}
              key={place}
              onClick={() => setFridgePlace(place)}
            >
              <AssetImage name={tabIconByPlace[place as keyof typeof tabIconByPlace]} alt="" className="storage-tab-icon" />
              <strong>{place}</strong>
              <small>{inventoryFoods.filter((f) => f.place === place).length} 种</small>
            </button>
          ))}
        </div>
      </div>
      <section
        className="storage-pane"
        style={{ backgroundImage: `url(/assets/${backgroundByPlace[fridgePlace as keyof typeof backgroundByPlace]})` }}
      >
        <div className="storage-heading">
          <h2>{fridgePlace}</h2>
          <button className="storage-add" disabled={loading || !snapshot} onClick={() => setAddChoiceOpen(true)}>
            ＋ 添加食材
          </button>
        </div>
        {loading ? (
          <div className="empty"><AssetImage name="general-loading.png" alt="" className="asset-state" /><span>正在打开冰箱……</span></div>
        ) : apiError ? (
          <div className="empty"><AssetImage name="loading-failed.png" alt="" className="asset-state" /><span>库存加载失败，请稍后重试</span></div>
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
                  <FoodEmoji name={f.name} />
                  <span>
                    <strong title={f.name}>{truncateFoodName(f.name)}</strong>
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
          <div className="empty"><AssetImage name="empty-inventory-state.png" alt="" className="asset-state" /><span>冰箱里还没记下什么食材。</span></div>
        )}
        <div className="pagination">
          <button
            aria-label="上一页"
            disabled={currentPage === 0}
            onClick={() => setPagesByPlace((pages) => ({
              ...pages,
              [fridgePlace]: Math.max(0, currentPage - 1),
            }))}
          >
            ‹
          </button>
          <span>
            {currentPage + 1} / {totalPages}
          </span>
          <button
            aria-label="下一页"
            disabled={currentPage >= totalPages - 1}
            onClick={() => setPagesByPlace((pages) => ({
              ...pages,
              [fridgePlace]: Math.min(totalPages - 1, currentPage + 1),
            }))}
          >
            ›
          </button>
        </div>
      </section>
      {addChoiceOpen && typeof document !== "undefined" && createPortal(
        <div className="overlay fridge-modal-overlay">
          <div className="food-modal add-choice-modal" role="dialog" aria-modal="true" aria-label="添加食材方式">
            <button className="modal-close" aria-label="关闭" onClick={() => setAddChoiceOpen(false)}>×</button>
            <h2>添加食材到“{fridgePlace}”</h2>
            <div className="modal-actions">
              <button onClick={() => {
                setNewFood({ name: "", qty: 1, unit: "个", place: fridgePlace, days: 0, source: "manual" });
                setAddChoiceOpen(false);
                setFoodModal("add");
              }}>
                <AssetImage name="edit.png" alt="" className="modal-choice-icon" />
                手动添加
              </button>
              <button onClick={() => {
                setAddChoiceOpen(false);
                go("capture");
              }}>
                <AssetImage name="quick-solution.png" alt="" className="modal-choice-icon" />
                帮我识别
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
      {foodModal && selected && typeof document !== "undefined" && createPortal(
        <div className="overlay fridge-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="food-modal-title">
          <div className="food-modal">
            {foodModal === "summary" ? (
              <>
                <button
                  className="modal-close"
                  aria-label="关闭"
                  onClick={() => setFoodModal(null)}
                >
                  ×
                </button>
                <div className="modal-food-title">
                  <FoodEmoji name={selected.name} />
                  <span>
                    <h2 id="food-modal-title">{selected.name}</h2>
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
                    <span className="ui-icon" aria-hidden="true">✎</span>
                    编辑信息
                  </button>
                  <button
                    onClick={() => {
                      setFoodModal(null);
                      setDialog("要移除这项食材吗？");
                    }}
                  >
                    <span className="ui-icon" aria-hidden="true">⌫</span>
                    移除食材
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 id="food-modal-title">{foodModal === "add" ? "新增食材信息" : "编辑食材信息"}</h2>
                <Field
                  food={selected}
                  onChange={setNewFood}
                  showPlace={false}
                  useOptionalExpiry={foodModal === "add"}
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
        </div>,
        document.body,
      )}
    </>
  );
}
