import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RecognizePage } from "../pages/RecognizePage";

describe("RecognizePage", () => {
  it("shows the scanning message", () => {
    render(<RecognizePage />);
    expect(screen.getByText("我看看都有些什么……")).toBeInTheDocument();
    expect(screen.getByText("稍等一下，很快就好。")).toBeInTheDocument();
  });
});
