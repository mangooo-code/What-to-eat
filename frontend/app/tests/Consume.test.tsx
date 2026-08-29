import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Consume } from "../components/Consume";

describe("Consume", () => {
  it("renders both ingredients with their predicted amounts", () => {
    render(<Consume onDone={() => {}} />);
    expect(screen.getByText("番茄")).toBeInTheDocument();
    expect(screen.getByText("鸡蛋")).toBeInTheDocument();
    expect(screen.getByText(/预计消耗 2 个/)).toBeInTheDocument();
    expect(screen.getByText(/预计消耗 3 个/)).toBeInTheDocument();
  });

  it("defaults to the predicted quantities when confirmed", () => {
    const onDone = vi.fn();
    render(<Consume onDone={onDone} />);
    fireEvent.click(screen.getByText("确认食材消耗"));
    expect(onDone).toHaveBeenCalledWith(2, 3);
  });

  it("never lets a quantity go negative", () => {
    render(<Consume onDone={() => {}} />);
    const [tomatoInput] = screen.getAllByRole("spinbutton");
    fireEvent.change(tomatoInput, { target: { value: "-4" } });
    expect(tomatoInput).toHaveValue(0);
  });

  it("clamps the confirmed amount to the max allowed", () => {
    const onDone = vi.fn();
    render(<Consume onDone={onDone} />);
    const [tomatoInput, eggInput] = screen.getAllByRole("spinbutton");
    fireEvent.change(tomatoInput, { target: { value: "9" } });
    fireEvent.change(eggInput, { target: { value: "9" } });
    fireEvent.click(screen.getByText("确认食材消耗"));
    expect(onDone).toHaveBeenCalledWith(2, 6);
  });
});
