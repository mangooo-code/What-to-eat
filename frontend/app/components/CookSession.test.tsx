import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CookSession } from "./CookSession";

const baseProps = {
  title: "一起做吧！",
  sub: "番茄炒蛋 · 预计 15 分钟",
  back: vi.fn(),
  showOtherRecipesLink: false,
  onOtherRecipesClick: vi.fn(),
  consumeOpen: false,
  onStartConsume: vi.fn(),
  onCloseConsume: vi.fn(),
  onEndCooking: vi.fn(),
  onConsumeDone: vi.fn(),
};

describe("CookSession", () => {
  it("renders the title and sub", () => {
    render(<CookSession {...baseProps} />);
    expect(screen.getByText("一起做吧！")).toBeInTheDocument();
    expect(screen.getByText("番茄炒蛋 · 预计 15 分钟")).toBeInTheDocument();
  });

  it("shows the other-recipes link only when asked", () => {
    const { rerender } = render(<CookSession {...baseProps} />);
    expect(screen.queryByText("‹ 看看其他菜谱")).not.toBeInTheDocument();

    rerender(<CookSession {...baseProps} showOtherRecipesLink />);
    const link = screen.getByText("‹ 看看其他菜谱");
    fireEvent.click(link);
    expect(baseProps.onOtherRecipesClick).toHaveBeenCalledTimes(1);
  });

  it("fires onStartConsume and onEndCooking", () => {
    const onStartConsume = vi.fn();
    const onEndCooking = vi.fn();
    render(<CookSession {...baseProps} onStartConsume={onStartConsume} onEndCooking={onEndCooking} />);
    fireEvent.click(screen.getByText("做好啦"));
    fireEvent.click(screen.getByText("结束制作"));
    expect(onStartConsume).toHaveBeenCalledTimes(1);
    expect(onEndCooking).toHaveBeenCalledTimes(1);
  });

  it("renders the consume modal only when open, and can close it", () => {
    const onCloseConsume = vi.fn();
    const { rerender } = render(<CookSession {...baseProps} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    rerender(<CookSession {...baseProps} consumeOpen onCloseConsume={onCloseConsume} />);
    expect(screen.getByRole("dialog", { name: "确认食材消耗" })).toBeInTheDocument();
    fireEvent.click(screen.getByText("×"));
    expect(onCloseConsume).toHaveBeenCalledTimes(1);
  });

  it("forwards consumption confirmation via onConsumeDone", () => {
    const onConsumeDone = vi.fn();
    render(<CookSession {...baseProps} consumeOpen onConsumeDone={onConsumeDone} />);
    fireEvent.click(screen.getByText("确认食材消耗"));
    expect(onConsumeDone).toHaveBeenCalledTimes(1);
  });
});
