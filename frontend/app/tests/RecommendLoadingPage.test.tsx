import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RecommendLoadingPage } from "../pages/RecommendLoadingPage";

describe("RecommendLoadingPage", () => {
  it("shows the first loading message", () => {
    render(<RecommendLoadingPage />);
    expect(screen.getByText("看看今天适合吃点什么……")).toBeInTheDocument();
  });
});
