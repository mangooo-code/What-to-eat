import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CapturePage } from "../pages/CapturePage";
import { useApp } from "../context/AppContext";
import { createAppState } from "./mockApp";

vi.mock("../context/AppContext", () => ({ useApp: vi.fn() }));
const mockedUseApp = vi.mocked(useApp);

function mockApp(overrides: Parameters<typeof createAppState>[0] = {}) {
  mockedUseApp.mockReturnValue(createAppState(overrides));
}

describe("CapturePage", () => {
  beforeEach(() => {
    mockApp();
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

  it("uses one preview and lets a new source replace the current photo", () => {
    const setPhotos = vi.fn();
    mockApp({ captureTab: "camera", photos: { camera: 0, album: 0 }, setPhotos });
    render(<CapturePage />);
    const recognize = screen.getByRole("button", { name: "开始识别" });
    expect(recognize).toBeDisabled();

    fireEvent.change(screen.getByLabelText("拍照文件输入"), {
      target: { files: [new File(["camera"], "camera.png", { type: "image/png" })] },
    });
    expect(screen.getByAltText("待识别食材预览")).toHaveAttribute("src", "blob:camera.png");
    expect(setPhotos).toHaveBeenLastCalledWith({ camera: 1, album: 0 });
    expect(recognize).toBeEnabled();

    fireEvent.change(screen.getByLabelText("相册文件输入"), {
      target: { files: [new File(["album"], "album.png", { type: "image/png" })] },
    });
    expect(screen.getByAltText("待识别食材预览")).toHaveAttribute("src", "blob:album.png");
    expect(screen.getAllByAltText("待识别食材预览")).toHaveLength(1);
    expect(setPhotos).toHaveBeenLastCalledWith({ camera: 0, album: 1 });

    fireEvent.click(screen.getByRole("button", { name: "删除照片" }));
    expect(screen.queryByAltText("待识别食材预览")).not.toBeInTheDocument();
    expect(setPhotos).toHaveBeenLastCalledWith({ camera: 0, album: 0 });
    expect(recognize).toBeDisabled();
  });

  it("navigates to recognize once photos are ready", () => {
    const go = vi.fn();
    const setFoods = vi.fn();
    mockApp({ captureTab: "camera", photos: { camera: 0, album: 0 }, go, setFoods });
    render(<CapturePage />);
    fireEvent.change(screen.getByLabelText("相册文件输入"), {
      target: { files: [new File(["album"], "album.png", { type: "image/png" })] },
    });
    fireEvent.click(screen.getByText("开始识别"));
    expect(setFoods).toHaveBeenCalled();
    expect(go).toHaveBeenCalledWith("recognize");
  });
});
