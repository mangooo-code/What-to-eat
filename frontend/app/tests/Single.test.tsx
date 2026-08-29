import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Single } from "../components/Single";

const opts = ["清淡", "家常", "香辣"];

describe("Single", () => {
  it("renders the title and all options", () => {
    render(
      <Single title="口味" opts={opts} selected="" onSelect={() => {}} />,
    );
    expect(screen.getByText("口味")).toBeInTheDocument();
    for (const opt of opts) {
      expect(screen.getByText(opt)).toBeInTheDocument();
    }
  });

  it("marks the selected option as active", () => {
    render(
      <Single title="口味" opts={opts} selected="家常" onSelect={() => {}} />,
    );
    expect(screen.getByText("家常")).toHaveClass("active");
    expect(screen.getByText("清淡")).not.toHaveClass("active");
  });

  it("calls onSelect with the clicked option", () => {
    const onSelect = vi.fn();
    render(
      <Single title="口味" opts={opts} selected="" onSelect={onSelect} />,
    );
    fireEvent.click(screen.getByText("香辣"));
    expect(onSelect).toHaveBeenCalledWith("香辣");
  });
});
