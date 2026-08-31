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
  });

  it("shows the single-photo section by default", () => {
    render(<CapturePage />);
    expect(screen.getByText("添加一张食材照片")).toBeInTheDocument();
    expect(screen.getByText("0 / 1")).toBeInTheDocument();
    expect(screen.getByText("拍照识别")).toBeInTheDocument();
    expect(screen.getByText("语音识别")).toBeInTheDocument();
    expect(screen.queryByText("从相册选")).not.toBeInTheDocument();
  });

  it("switches to the voice tab", () => {
    const setCaptureTab = vi.fn();
    mockApp({ setCaptureTab });
    render(<CapturePage />);
    fireEvent.click(screen.getByText("语音识别"));
    expect(setCaptureTab).toHaveBeenCalledWith("voice");
  });

  it("shows the voice-parse section when the voice tab is active", () => {
    mockApp({ captureTab: "voice" });
    render(<CapturePage />);
    expect(
      screen.getByText("轻点麦克风，口述刚刚买的食材"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "开始语音录入" }).querySelector("img")).toHaveAttribute("src", "/assets/voice-analysis.png");
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

  it("opens a bottom sheet with camera and album choices", () => {
    mockApp({ captureTab: "camera", photos: { camera: 0, album: 0 } });
    render(<CapturePage />);
    fireEvent.click(screen.getByText("添加照片"));
    expect(screen.getByRole("dialog", { name: "选择照片来源" })).toBeInTheDocument();
    expect(screen.getByText("拍照")).toBeInTheDocument();
    expect(screen.getByText("从相册选择")).toBeInTheDocument();
  });

  it("navigates to recognize once photos are ready", () => {
    const go = vi.fn();
    const setFoods = vi.fn();
    mockApp({ captureTab: "camera", photos: { camera: 1, album: 0 }, go, setFoods });
    render(<CapturePage />);
    fireEvent.click(screen.getByText("开始识别"));
    expect(setFoods).toHaveBeenCalled();
    expect(go).toHaveBeenCalledWith("recognize");
  });
});
