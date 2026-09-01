import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LoadingSequence } from "../components/LoadingSequence";

const texts = ["看看今天适合吃点什么……", "正在看看冰箱里有什么", "最后一条"];

describe("LoadingSequence", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the first text immediately", () => {
    render(<LoadingSequence texts={texts} />);
    expect(screen.getByText(texts[0])).toBeInTheDocument();
  });

  it("advances to the next text after the hold and transition", () => {
    render(<LoadingSequence texts={texts} />);
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.getByText(texts[1])).toBeInTheDocument();
  });

  it("stops advancing once the last text is reached", () => {
    render(<LoadingSequence texts={texts} />);
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(screen.getByText(texts[texts.length - 1])).toBeInTheDocument();
  });
});
