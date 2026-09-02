import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CapturePage } from "./CapturePage";
import { useApp } from "../context/AppContext";
import { createAppState } from "../tests/mockApp";
import { recognitionService } from "../services/recognitionService";

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

function mockApp(overrides: Parameters<typeof createAppState>[0] = {}) {
  mockedUseApp.mockReturnValue(createAppState(overrides));
}

describe("CapturePage", () => {
  beforeEach(() => {
    mockApp();
    mockedRecognizeIngredients.mockReset();
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn((file: File) => `blob:${file.name}`),
      revokeObjectURL: vi.fn(),
    });
  });

  it("shows the single-photo section by default", () => {
    render(<CapturePage />);
    expect(screen.getByText("添加一张食材照片")).toBeInTheDocument();
    expect(screen.getByText("目前仅支持上传一张照片，尽量拍清楚一点。")).toBeInTheDocument();
    expect(screen.getByText("拍照识别")).toBeInTheDocument();
    expect(screen.getByText("语音识别")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "拍照" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "从相册选择" })).toBeInTheDocument();
  });

  it("switches to the voice tab", () => {
    const setCaptureTab = vi.fn();
    mockApp({ setCaptureTab });
    render(<CapturePage />);
    fireEvent.click(screen.getByText("语音识别"));
    expect(setCaptureTab).toHaveBeenCalledWith("voice");
  });

  it("shows the voice-parse section when the voice tab is active", () => {
    mockApp({ captureTab: "voice", input: "旧的识别参考" });
    render(<CapturePage />);
    expect(
      screen.getByText("轻点麦克风，口述刚刚买的食材"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "开始语音录入" }).querySelector("img")).toHaveAttribute("src", "/assets/voice-analysis.png");
    expect(screen.queryByText(/本次识别参考/)).not.toBeInTheDocument();
  });

  it("starts listening when the mic is tapped", () => {
    const setListening = vi.fn();
    mockApp({ captureTab: "voice", listening: false, setListening });
    render(<CapturePage />);
    fireEvent.click(screen.getByRole("button", { name: "开始语音录入" }));
    expect(setListening).toHaveBeenCalledWith(true);
  });

  it("stops recording and automatically starts recognition", () => {
    const setInput = vi.fn();
    const setListening = vi.fn();
    const setFoods = vi.fn();
    const go = vi.fn();
    mockApp({ captureTab: "voice", listening: true, setInput, setListening, setFoods, go });
    render(<CapturePage />);
    fireEvent.click(screen.getByRole("button", { name: "完成语音录入" }));
    expect(setInput).toHaveBeenCalledWith("买了西红柿 2 个、鸡蛋 1 盒、牛肉半斤");
    expect(setListening).toHaveBeenCalledWith(false);
    expect(setFoods).toHaveBeenCalled();
    expect(go).toHaveBeenCalledWith("recognize");
  });

  it("stores camera and album files in the shared image state", () => {
    const setPhotos = vi.fn();
    const setRecognitionImage = vi.fn();
    mockApp({ captureTab: "camera", setPhotos, setRecognitionImage });
    render(<CapturePage />);

    const cameraFile = new File(["camera"], "camera.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("拍照文件输入"), {
      target: { files: [cameraFile] },
    });
    expect(setRecognitionImage).toHaveBeenLastCalledWith(cameraFile);
    expect(setPhotos).toHaveBeenLastCalledWith({ camera: 1, album: 0 });

    const albumFile = new File(["album"], "album.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("相册文件输入"), {
      target: { files: [albumFile] },
    });
    expect(setRecognitionImage).toHaveBeenLastCalledWith(albumFile);
    expect(setPhotos).toHaveBeenLastCalledWith({ camera: 0, album: 1 });
  });

  it("rejects unsupported camera files and retains the existing image", () => {
    const setPhotos = vi.fn();
    const setRecognitionImage = vi.fn();
    const say = vi.fn();
    const existingImage = new File(["existing"], "existing.png", { type: "image/png" });
    mockApp({
      captureTab: "camera",
      recognitionImageFile: existingImage,
      recognitionImagePreviewUrl: "blob:existing.png",
      setPhotos,
      setRecognitionImage,
      say,
    });
    render(<CapturePage />);

    const unsupported = new File(["gif"], "photo.gif", { type: "image/gif" });
    fireEvent.change(screen.getByLabelText("拍照文件输入"), {
      target: { files: [unsupported] },
    });

    expect(say).toHaveBeenCalledWith("仅支持 JPG、PNG、WEBP 格式的图片");
    expect(setRecognitionImage).not.toHaveBeenCalled();
    expect(setPhotos).not.toHaveBeenCalled();
    expect(screen.getByAltText("待识别食材预览")).toHaveAttribute("src", "blob:existing.png");
  });

  it("rejects empty album files and retains the existing image", () => {
    const setPhotos = vi.fn();
    const setRecognitionImage = vi.fn();
    const say = vi.fn();
    const existingImage = new File(["existing"], "existing.webp", { type: "image/webp" });
    mockApp({
      captureTab: "album",
      recognitionImageFile: existingImage,
      recognitionImagePreviewUrl: "blob:existing.webp",
      setPhotos,
      setRecognitionImage,
      say,
    });
    render(<CapturePage />);

    const empty = new File([], "empty.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("相册文件输入"), {
      target: { files: [empty] },
    });

    expect(say).toHaveBeenCalledWith("图片文件无效，请重新选择");
    expect(setRecognitionImage).not.toHaveBeenCalled();
    expect(setPhotos).not.toHaveBeenCalled();
    expect(screen.getByAltText("待识别食材预览")).toHaveAttribute("src", "blob:existing.webp");
  });

  it("shows and clears the shared image preview", () => {
    const setPhotos = vi.fn();
    const setRecognitionImage = vi.fn();
    mockApp({
      recognitionImageFile: new File(["image"], "kept.png", { type: "image/png" }),
      recognitionImagePreviewUrl: "blob:kept.png",
      setPhotos,
      setRecognitionImage,
    });
    render(<CapturePage />);
    expect(screen.getByAltText("待识别食材预览")).toHaveAttribute("src", "blob:kept.png");
    fireEvent.click(screen.getByRole("button", { name: "删除照片" }));
    expect(setRecognitionImage).toHaveBeenCalledWith(null);
    expect(setPhotos).toHaveBeenLastCalledWith({ camera: 0, album: 0 });
  });

  it("uploads the real image and enters the confirm flow with API items", async () => {
    const go = vi.fn();
    const setFoods = vi.fn();
    const image = new File(["real image bytes"], "album.png", { type: "image/png" });
    mockApp({
      captureTab: "camera",
      recognitionImageFile: image,
      recognitionImagePreviewUrl: "blob:album.png",
      go,
      setFoods,
    });
    mockedRecognizeIngredients.mockResolvedValue({
      items: [
        { name: "番茄", normalizedName: "番茄", quantity: 2, unit: "个" },
        { name: "鸡蛋", normalizedName: "鸡蛋", quantity: 1, unit: "盒" },
      ],
    });
    render(<CapturePage />);
    fireEvent.click(screen.getByText("开始识别"));
    await waitFor(() => expect(mockedRecognizeIngredients).toHaveBeenCalledWith(image));
    expect(setFoods).toHaveBeenCalledWith([
      { name: "番茄", normalizedName: "番茄", qty: 2, unit: "个", place: "冷藏", days: null, source: "recognition" },
      { name: "鸡蛋", normalizedName: "鸡蛋", qty: 1, unit: "盒", place: "冷藏", days: null, source: "recognition" },
    ]);
    expect(go).toHaveBeenCalledWith("recognize");
  });

  it("shows an understandable error, retains the image, and does not navigate", async () => {
    const go = vi.fn();
    const say = vi.fn();
    const image = new File(["image"], "kept.png", { type: "image/png" });
    mockApp({
      go,
      say,
      recognitionImageFile: image,
      recognitionImagePreviewUrl: "blob:kept.png",
    });
    mockedRecognizeIngredients.mockRejectedValue(new Error("server unavailable"));
    render(<CapturePage />);
    fireEvent.click(screen.getByText("开始识别"));

    await waitFor(() => expect(say).toHaveBeenCalledWith("图片识别失败，请稍后直接重试。"));
    expect(screen.getByAltText("待识别食材预览")).toHaveAttribute("src", "blob:kept.png");
    expect(go).not.toHaveBeenCalledWith("recognize");
  });
});
