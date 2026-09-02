import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { Field } from "./Field";
import { ingredientService } from "../services/ingredientService";

const food = { name: "番茄", qty: 2, unit: "个", place: "冷藏", days: 3 };

vi.mock("../services/ingredientService", () => ({
  ingredientService: { listUnitTypes: vi.fn() },
}));
const mockedListUnitTypes = vi.mocked(ingredientService.listUnitTypes);

const unitTypes = ["个", "颗", "根", "块", "盒", "袋", "瓶", "g", "kg", "ml", "L"].map((name, id) => ({ id, name }));

describe("Field", () => {
  beforeEach(() => {
    mockedListUnitTypes.mockResolvedValue(unitTypes);
  });

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

  it("calls onChange with the new unit", async () => {
    const onChange = vi.fn();
    render(<Field food={food} onChange={onChange} />);
    await screen.findByRole("option", { name: "kg" });
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

  it("can hide the storage field when the entry area is predetermined", () => {
    render(<Field food={food} onChange={() => {}} showPlace={false} />);
    expect(screen.queryByLabelText("存放位置")).not.toBeInTheDocument();
  });

  it("floors the days-until-expiry value", () => {
    const onChange = vi.fn();
    render(<Field food={food} onChange={onChange} />);
    const [, daysInput] = screen.getAllByRole("spinbutton");
    fireEvent.change(daysInput, { target: { value: "4.9" } });
    expect(onChange).toHaveBeenCalledWith({ ...food, days: 4 });
  });

  it("supports an optional preset expiry for manual entry", () => {
    const onChange = vi.fn();
    const unsetFood = { ...food, days: null };
    render(<Field food={unsetFood} onChange={onChange} useOptionalExpiry />);

    const expirySelect = screen.getByLabelText("过期时间（选填）");
    expect(expirySelect).toHaveValue("none");
    expect(screen.queryByLabelText("自定义过期天数")).not.toBeInTheDocument();

    fireEvent.change(expirySelect, { target: { value: "7" } });
    expect(onChange).toHaveBeenCalledWith({ ...unsetFood, days: 7 });
  });

  it("only shows a positive day input for a custom expiry", () => {
    const onChange = vi.fn();
    const unsetFood = { ...food, days: null };
    render(<Field food={unsetFood} onChange={onChange} useOptionalExpiry />);

    fireEvent.change(screen.getByLabelText("过期时间（选填）"), {
      target: { value: "custom" },
    });
    expect(screen.getByLabelText("自定义过期天数")).toHaveValue(1);
    expect(onChange).toHaveBeenCalledWith({ ...unsetFood, days: 1 });
  });
});
