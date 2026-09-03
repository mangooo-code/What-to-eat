import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Consume } from "./Consume";

const ingredients = [
  { name: "番茄", quantity: 2, unit: "个" },
  { name: "鸡蛋", quantity: 3, unit: "个" },
];

describe("Consume", () => {
  it("renders each ingredient with its predicted amount", () => {
    render(<Consume ingredients={ingredients} onDone={() => {}} />);
    expect(screen.getByText("番茄")).toBeInTheDocument();
    expect(screen.getByText("鸡蛋")).toBeInTheDocument();
    expect(screen.getByText(/预计消耗 2 个/)).toBeInTheDocument();
    expect(screen.getByText(/预计消耗 3 个/)).toBeInTheDocument();
  });

  it("shows a fallback message when there are no ingredients", () => {
    render(<Consume ingredients={[]} onDone={() => {}} />);
    expect(screen.getByText(/暂无食材信息/)).toBeInTheDocument();
  });

  it("defaults to the predicted quantities when confirmed", () => {
    const onDone = vi.fn();
    render(<Consume ingredients={ingredients} onDone={onDone} />);
    fireEvent.click(screen.getByText("确认食材消耗"));
    expect(onDone).toHaveBeenCalledWith([
      { name: "番茄", quantity: 2 },
      { name: "鸡蛋", quantity: 3 },
    ]);
  });

  it("never lets a quantity go negative", () => {
    render(<Consume ingredients={ingredients} onDone={() => {}} />);
    const [tomatoInput] = screen.getAllByRole("spinbutton");
    fireEvent.change(tomatoInput, { target: { value: "-4" } });
    expect(tomatoInput).toHaveValue(0);
  });

  it("reports the actually entered amounts when they differ from the prediction", () => {
    const onDone = vi.fn();
    render(<Consume ingredients={ingredients} onDone={onDone} />);
    const [tomatoInput, eggInput] = screen.getAllByRole("spinbutton");
    fireEvent.change(tomatoInput, { target: { value: "1" } });
    fireEvent.change(eggInput, { target: { value: "5" } });
    fireEvent.click(screen.getByText("确认食材消耗"));
    expect(onDone).toHaveBeenCalledWith([
      { name: "番茄", quantity: 1 },
      { name: "鸡蛋", quantity: 5 },
    ]);
  });
});
