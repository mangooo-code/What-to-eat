import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Placeholder } from "../components/Placeholder";

describe("Placeholder", () => {
  it("renders an image placeholder by default", () => {
    render(<Placeholder />);
    const el = screen.getByText("图片占位");
    expect(el).toHaveClass("image-placeholder");
    expect(el).not.toHaveClass("wide");
  });

  it("renders an icon placeholder when kind is icon", () => {
    render(<Placeholder kind="icon" />);
    const el = screen.getByText("图标占位");
    expect(el).toHaveClass("icon-placeholder");
  });

  it("adds the wide class when wide is true", () => {
    render(<Placeholder wide />);
    expect(screen.getByText("图片占位")).toHaveClass("wide");
  });
});
