"use client";
import { useApp } from "../context/AppContext";
import { Field } from "../components/Field";
import { Header } from "../components/Header";

export function EditPage() {
  const { foods, editIndex, setFoods, go, say, setDialog } = useApp();
  const food = foods[editIndex];
  if (!food) return null;
  return (
    <>
      <Header title="编辑食材" back={() => go("fridge")} />
      <Field
        food={food}
        onChange={(f) =>
          setFoods((a) => a.map((x, i) => (i === editIndex ? f : x)))
        }
      />
      <div className="sticky-actions">
        <button
          className="primary"
          onClick={() => {
            say("已保存修改");
            go("fridge");
          }}
        >
          保存修改
        </button>
        <button
          className="danger-link"
          onClick={() => setDialog("删除这项食材？")}
        >
          删除食材
        </button>
      </div>
    </>
  );
}
