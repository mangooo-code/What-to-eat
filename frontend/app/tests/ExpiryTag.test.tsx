import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExpiryTag } from "../components/ExpiryTag";

describe("ExpiryTag", () => {
  it("shows expired for negative days", () => {
    render(<ExpiryTag days={-1} />);
    const el = screen.getByText("已过期");
    expect(el).toHaveClass("expired");
  });

  it("shows urgent 'due today' for zero days", () => {
    render(<ExpiryTag days={0} />);
    const el = screen.getByText("今日到期");
    expect(el).toHaveClass("urgent");
  });

  it("shows unknown when no expiry date is stored", () => {
    render(<ExpiryTag days={0} expiryDate={null} />);
    expect(screen.getByText("未知")).toBeInTheDocument();
    expect(screen.queryByText("正常")).not.toBeInTheDocument();
  });

  it("shows urgent 'expiring soon' for 1-3 days", () => {
    render(<ExpiryTag days={3} />);
    const el = screen.getByText("即将过期");
    expect(el).toHaveClass("urgent");
  });

  it("shows normal for more than 3 days", () => {
    render(<ExpiryTag days={4} />);
    const el = screen.getByText("正常");
    expect(el).toHaveClass("normal");
  });
});
