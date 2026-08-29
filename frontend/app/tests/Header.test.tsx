import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Header } from "../components/Header";

describe("Header", () => {
  it("renders the title and subtitle", () => {
    render(<Header title="标题" sub="副标题" />);
    expect(screen.getByRole("heading", { name: "标题" })).toBeInTheDocument();
    expect(screen.getByText("副标题")).toBeInTheDocument();
  });

  it("omits the subtitle when not provided", () => {
    render(<Header title="标题" />);
    expect(screen.queryByText("副标题")).not.toBeInTheDocument();
  });

  it("does not render a back button when back is not provided", () => {
    render(<Header title="标题" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders a back button and calls back when clicked", () => {
    const back = vi.fn();
    render(<Header title="标题" back={back} />);
    fireEvent.click(screen.getByRole("button", { name: /返回/ }));
    expect(back).toHaveBeenCalledTimes(1);
  });
});
