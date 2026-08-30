"use client";
import { useState } from "react";
import { useApp } from "../context/AppContext";
import { Field } from "../components/Field";
import { Header } from "../components/Header";
import { inventoryService } from "../services/inventoryService";

const keyByPlace = { 冷藏: "fridge", 冷冻: "freezer", 常温: "pantry" } as const;

export function EditPage() {
  const { foods, editIndex, setFoods, go, say, setDialog } = useApp();
  const [draft, setDraft] = useState(() => foods[editIndex]);
  const [saving, setSaving] = useState(false);
  const food = foods[editIndex];
  if (!food || !draft) return null;
  return (
    <>
      <Header title="编辑食材" back={() => go("fridge")} />
      <Field
        food={draft}
        onChange={setDraft}
      />
      <div className="sticky-actions">
        <button
          className="primary"
          disabled={saving}
          onClick={async () => {
            if (!food.id) return say("保存失败：库存数据缺少稳定 ID");
            setSaving(true);
            try {
              const snapshot = await inventoryService.list();
              const locationKey = keyByPlace[draft.place as keyof typeof keyByPlace];
              const locationId = snapshot.locations.find((item) => item.key === locationKey)?.id;
              const unitTypeId = snapshot.unitTypes.find((item) => item.name === draft.unit)?.id;
              if (!locationId || !unitTypeId) throw new Error("库存基础数据不完整");
              const saved = await inventoryService.update(food.id, {
                name: draft.name.trim(),
                normalizedName: draft.normalizedName ?? draft.name.trim(),
                quantity: Number(draft.qty),
                unitTypeId,
                locationId,
                expiryDate: new Date(Date.now() + draft.days * 86_400_000).toISOString(),
                imageFileId: draft.imageFileId ?? null,
                source: draft.source ?? "manual",
              });
              setFoods((items) => items.map((item) => item.id === saved.id ? {
                ...draft,
                id: saved.id,
                locationId: saved.locationId,
                unitTypeId: saved.unitTypeId,
                expiryDate: saved.expiryDate,
                updatedDate: saved.updatedDate,
              } : item));
              say("已保存修改");
              go("fridge");
            } catch (error) {
              say(`保存失败：${error instanceof Error ? error.message : "请稍后重试"}`);
            } finally {
              setSaving(false);
            }
          }}
        >
          {saving ? "保存中……" : "保存修改"}
        </button>
        <button
          className="danger-link"
          onClick={() => setDialog("要移除这项食材吗？")}
        >
          删除食材
        </button>
      </div>
    </>
  );
}
