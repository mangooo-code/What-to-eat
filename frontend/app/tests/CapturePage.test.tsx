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

  it("shows the camera upload section by default", () => {
    render(<CapturePage />);
    expect(screen.getByText("拍下冰箱或食材")).toBeInTheDocument();
  });

  it("switches to the voice tab", () => {
    const setCaptureTab = vi.fn();
    mockApp({ setCaptureTab });
    render(<CapturePage />);
    fireEvent.click(screen.getByText("语音解析"));
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

  it("fills in the recognized text and stops listening", () => {
    const setInput = vi.fn();
    const setListening = vi.fn();
    mockApp({ captureTab: "voice", listening: true, setInput, setListening });
    render(<CapturePage />);
    fireEvent.click(screen.getByRole("button", { name: "完成语音录入" }));
    expect(setInput).toHaveBeenCalledWith("买了西红柿 2 个、鸡蛋 1 盒、牛肉半斤");
    expect(setListening).toHaveBeenCalledWith(false);
  });

  it("adds a photo when the capture button is pressed", () => {
    const setPhotos = vi.fn();
    mockApp({ captureTab: "camera", photos: { camera: 0, album: 0 }, setPhotos });
    render(<CapturePage />);
    fireEvent.click(screen.getByText("拍照"));
    expect(setPhotos).toHaveBeenCalledTimes(1);
  });

  it("navigates to recognize once photos are ready", () => {
    const go = vi.fn();
    mockApp({ captureTab: "camera", go });
    render(<CapturePage />);
    fireEvent.click(screen.getByText("开始识别"));
    expect(go).toHaveBeenCalledWith("recognize");
  });
});
