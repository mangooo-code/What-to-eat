import { StrictMode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RecognizePage } from "../pages/RecognizePage";
import { useApp } from "../context/AppContext";
import { recognitionService } from "../services/recognitionService";
import { createAppState } from "./mockApp";

vi.mock("../context/AppContext", () => ({ useApp: vi.fn() }));
vi.mock("../services/recognitionService", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../services/recognitionService")>();
  return {
    ...actual,
    recognitionService: { recognizeIngredients: vi.fn() },
  };
});

const mockedUseApp = vi.mocked(useApp);
const mockedRecognizeIngredients = vi.mocked(recognitionService.recognizeIngredients);

describe("RecognizePage", () => {
  beforeEach(() => {
    mockedUseApp.mockReturnValue(createAppState());
    mockedRecognizeIngredients.mockReset();
  });

  it("shows the scanning message", () => {
    mockedUseApp.mockReturnValue(createAppState({
      recognitionImageFile: new File(["image"], "food.png", { type: "image/png" }),
    }));
    mockedRecognizeIngredients.mockReturnValue(new Promise(() => {}));
    render(<RecognizePage />);
    expect(screen.getByText("让我仔细看看……")).toBeInTheDocument();
    expect(screen.getByText("稍等一下，很快就好。")).toBeInTheDocument();
  });

  it("only sends one request in Strict Mode and enters confirm after success", async () => {
    const image = new File(["image"], "food.png", { type: "image/png" });
    const setFoods = vi.fn();
    const go = vi.fn();
    mockedUseApp.mockReturnValue(createAppState({ recognitionImageFile: image, setFoods, go }));
    mockedRecognizeIngredients.mockResolvedValue({
      items: [{ name: "番茄", normalizedName: "番茄", quantity: 2, unit: "个" }],
    });

    render(<StrictMode><RecognizePage /></StrictMode>);

    await waitFor(() => expect(go).toHaveBeenCalledWith("confirm"));
    expect(mockedRecognizeIngredients).toHaveBeenCalledTimes(1);
    expect(mockedRecognizeIngredients).toHaveBeenCalledWith(image);
    expect(setFoods).toHaveBeenCalledWith([
      { name: "番茄", normalizedName: "番茄", qty: 2, unit: "个", place: "冷藏", days: null, source: "recognition" },
    ]);
  });

  it("shows an error and returns to capture while retaining the image", async () => {
    const image = new File(["image"], "kept.png", { type: "image/png" });
    const say = vi.fn();
    const go = vi.fn();
    const setRecognitionImage = vi.fn();
    mockedUseApp.mockReturnValue(createAppState({
      recognitionImageFile: image,
      say,
      go,
      setRecognitionImage,
    }));
    mockedRecognizeIngredients.mockRejectedValue(new Error("failed"));

    render(<RecognizePage />);

    await waitFor(() => expect(go).toHaveBeenCalledWith("capture"));
    expect(say).toHaveBeenCalledWith("图片识别失败，请稍后直接重试。");
    expect(setRecognitionImage).not.toHaveBeenCalled();
  });

  it("returns to capture without requesting when the image File is missing", async () => {
    const go = vi.fn();
    mockedUseApp.mockReturnValue(createAppState({ recognitionImageFile: null, go }));

    render(<RecognizePage />);

    await waitFor(() => expect(go).toHaveBeenCalledWith("capture"));
    expect(mockedRecognizeIngredients).not.toHaveBeenCalled();
  });

  it("does not enter confirm on the former fixed two-second timer", () => {
    vi.useFakeTimers();
    const image = new File(["image"], "food.png", { type: "image/png" });
    const go = vi.fn();
    mockedUseApp.mockReturnValue(createAppState({ recognitionImageFile: image, go }));
    mockedRecognizeIngredients.mockReturnValue(new Promise(() => {}));

    render(<RecognizePage />);
    vi.advanceTimersByTime(2_000);

    expect(go).not.toHaveBeenCalledWith("confirm");
    vi.useRealTimers();
  });

  it("does not navigate after the page unmounts while a request is pending", async () => {
    const image = new File(["image"], "food.png", { type: "image/png" });
    const go = vi.fn();
    let resolveRequest!: (value: { items: [] }) => void;
    mockedUseApp.mockReturnValue(createAppState({ recognitionImageFile: image, go }));
    mockedRecognizeIngredients.mockReturnValue(new Promise((resolve) => {
      resolveRequest = resolve;
    }));

    const view = render(<RecognizePage />);
    view.unmount();
    resolveRequest({ items: [] });
    await Promise.resolve();

    expect(go).not.toHaveBeenCalledWith("confirm");
  });
});
