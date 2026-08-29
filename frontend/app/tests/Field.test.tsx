import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Field } from "../components/Field";

const food = { name: "番茄", qty: 2, unit: "个", place: "冷藏", days: 3 };

describe("Field", () => {
  it("renders the current food values", () => {
    render(<Field food={food} onChange={() => {}} />);
    expect(screen.getByLabelText("食材名称")).toHaveValue("番茄");
    expect(screen.getByLabelText("单位")).toHaveValue("个");
    expect(screen.getByLabelText("存放位置")).toHaveValue("冷藏");
    const [qtyInput, daysInput] = screen.getAllByRole("spinbutton");
    expect(qtyInput).toHaveValue(2);
    expect(daysInput).toHaveValue(3);
  });

  it("calls onChange with the new name", () => {
    const onChange = vi.fn();
    render(<Field food={food} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("食材名称"), {
      target: { value: "青椒" },
    });
    expect(onChange).toHaveBeenCalledWith({ ...food, name: "青椒" });
  });

  it("clamps quantity to a non-negative integer", () => {
    const onChange = vi.fn();
    render(<Field food={food} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("数量"), {
      target: { value: "-5" },
    });
    expect(onChange).toHaveBeenCalledWith({ ...food, qty: 0 });
  });

  it("calls onChange with the new unit", () => {
    const onChange = vi.fn();
    render(<Field food={food} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("单位"), {
      target: { value: "kg" },
    });
    expect(onChange).toHaveBeenCalledWith({ ...food, unit: "kg" });
  });

  it("calls onChange with the new storage place", () => {
    const onChange = vi.fn();
    render(<Field food={food} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("存放位置"), {
      target: { value: "冷冻" },
    });
    expect(onChange).toHaveBeenCalledWith({ ...food, place: "冷冻" });
  });

  it("floors the days-until-expiry value", () => {
    const onChange = vi.fn();
    render(<Field food={food} onChange={onChange} />);
    const [, daysInput] = screen.getAllByRole("spinbutton");
    fireEvent.change(daysInput, { target: { value: "4.9" } });
    expect(onChange).toHaveBeenCalledWith({ ...food, days: 4 });
  });
});
