import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { RecipeStepCard } from "./RecipeStepCard";
import { vi } from "vitest";

const step = { title: "炒鸡蛋", detailedInstructions: "锅中加入食用油……", time: 3 };

describe("RecipeStepCard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the step name, description and duration", () => {
    render(<RecipeStepCard index={0} step={step} timer={false} />);
    expect(screen.getByText("炒鸡蛋")).toBeInTheDocument();
    expect(screen.getByText("锅中加入食用油……")).toBeInTheDocument();
    expect(screen.getByText("3 分钟")).toBeInTheDocument();
  });

  it("does not render a timer when timer is false", () => {
    render(<RecipeStepCard index={0} step={step} timer={false} />);
    expect(screen.queryByText("开始计时")).not.toBeInTheDocument();
  });

  it("counts down once started", () => {
    render(<RecipeStepCard index={0} step={step} timer />);
    expect(screen.getByText("03:00")).toBeInTheDocument();
    fireEvent.click(screen.getByText("开始计时"));
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText("02:59")).toBeInTheDocument();
    expect(screen.getByText("暂停")).toBeInTheDocument();
  });

  it("resets the timer back to its initial value", () => {
    render(<RecipeStepCard index={0} step={step} timer />);
    fireEvent.click(screen.getByText("开始计时"));
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    fireEvent.click(screen.getByText("清零"));
    expect(screen.getByText("03:00")).toBeInTheDocument();
    expect(screen.getByText("开始计时")).toBeInTheDocument();
  });

  it("toggles the completed state", () => {
    render(<RecipeStepCard index={0} step={step} timer={false} />);
    fireEvent.click(screen.getByText("标记已完成"));
    expect(screen.getByText("✓ 已完成 · 重新打开")).toBeInTheDocument();
    fireEvent.click(screen.getByText("✓ 已完成 · 重新打开"));
    expect(screen.getByText("标记已完成")).toBeInTheDocument();
  });

  it("disables the timer and reset buttons once the step is marked done, and re-enables them when reopened", () => {
    render(<RecipeStepCard index={0} step={step} timer />);
    fireEvent.click(screen.getByText("开始计时"));
    fireEvent.click(screen.getByText("标记已完成"));
    expect(screen.getByText("开始计时")).toBeDisabled();
    expect(screen.getByText("清零")).toBeDisabled();

    fireEvent.click(screen.getByText("✓ 已完成 · 重新打开"));
    expect(screen.getByText("开始计时")).not.toBeDisabled();
    expect(screen.getByText("清零")).not.toBeDisabled();
  });

  it("pauses the timer when the step is marked done", () => {
    render(<RecipeStepCard index={0} step={step} timer />);
    fireEvent.click(screen.getByText("开始计时"));
    fireEvent.click(screen.getByText("标记已完成"));
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText("03:00")).toBeInTheDocument();
  });

  it("falls back to a 3-minute timer when the step has no time estimate", () => {
    render(<RecipeStepCard index={0} step={{ ...step, time: null }} timer />);
    expect(screen.getByText("03:00")).toBeInTheDocument();
    expect(screen.queryByText("3 分钟")).not.toBeInTheDocument();
  });
});
