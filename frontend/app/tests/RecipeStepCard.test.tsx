import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { RecipeStepCard } from "../components/RecipeStepCard";
import { vi } from "vitest";

const data = ["第 1 步｜炒鸡蛋", "锅中加入食用油……", "3 分钟"];

describe("RecipeStepCard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the step name, description and duration", () => {
    render(<RecipeStepCard index={0} data={data} timer={false} />);
    expect(screen.getByText("炒鸡蛋")).toBeInTheDocument();
    expect(screen.getByText("锅中加入食用油……")).toBeInTheDocument();
    expect(screen.getByText("3 分钟")).toBeInTheDocument();
  });

  it("does not render a timer when timer is false", () => {
    render(<RecipeStepCard index={0} data={data} timer={false} />);
    expect(screen.queryByText("开始计时")).not.toBeInTheDocument();
  });

  it("counts down once started", () => {
    render(<RecipeStepCard index={0} data={data} timer />);
    expect(screen.getByText("03:00")).toBeInTheDocument();
    fireEvent.click(screen.getByText("开始计时"));
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText("02:59")).toBeInTheDocument();
    expect(screen.getByText("暂停")).toBeInTheDocument();
  });

  it("resets the timer back to its initial value", () => {
    render(<RecipeStepCard index={0} data={data} timer />);
    fireEvent.click(screen.getByText("开始计时"));
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    fireEvent.click(screen.getByText("清零"));
    expect(screen.getByText("03:00")).toBeInTheDocument();
    expect(screen.getByText("开始计时")).toBeInTheDocument();
  });

  it("toggles the completed state", () => {
    render(<RecipeStepCard index={0} data={data} timer={false} />);
    fireEvent.click(screen.getByText("标记已完成"));
    expect(screen.getByText("✓ 已完成 · 重新打开")).toBeInTheDocument();
    fireEvent.click(screen.getByText("✓ 已完成 · 重新打开"));
    expect(screen.getByText("标记已完成")).toBeInTheDocument();
  });
});
