import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Choice } from "./Choice";

describe("Choice", () => {
  it("renders the label and optional help text", () => {
    render(
      <Choice label="快速解决" help="15-30 分钟" selected={false} onClick={() => {}} />,
    );
    expect(screen.getByText("快速解决")).toBeInTheDocument();
    expect(screen.getByText("15-30 分钟")).toBeInTheDocument();
  });

  it("applies the selected class when selected", () => {
    render(<Choice label="快速解决" selected onClick={() => {}} />);
    expect(screen.getByRole("button")).toHaveClass("selected");
  });

  it("does not apply the selected class when not selected", () => {
    render(<Choice label="快速解决" selected={false} onClick={() => {}} />);
    expect(screen.getByRole("button")).not.toHaveClass("selected");
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(<Choice label="快速解决" selected={false} onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
