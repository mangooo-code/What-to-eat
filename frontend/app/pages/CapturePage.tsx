"use client";
import "../styles/pages/capture.css";
import "../styles/components/tabs.css";
import { useApp } from "../context/AppContext";
import { Header } from "../components/Header";
import { Placeholder } from "../components/Placeholder";
import { AssetImage } from "../components/AssetImage";

export function CapturePage() {
  const {
    captureTab,
    setCaptureTab,
    photos,
    setPhotos,
    listening,
    setListening,
    input,
    setInput,
    go,
  } = useApp();
  const photoMode =
      captureTab === "camera" || captureTab === "album" ? captureTab : null,
    count = photoMode ? photos[photoMode] : 0;
  return (
    <>
      <Header
        title="让我看看家里有什么"
        sub="拍给我看，或者直接告诉我都可以。"
        back={() => go("fridge")}
      />
      <div className="tabs capture-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={captureTab === "camera"}
          className={captureTab === "camera" ? "active" : ""}
          onClick={() => setCaptureTab("camera")}
        >
          拍一张
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={captureTab === "album"}
          className={captureTab === "album" ? "active" : ""}
          onClick={() => setCaptureTab("album")}
        >
          从相册选
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={captureTab === "voice"}
          className={captureTab === "voice" ? "active" : ""}
          onClick={() => setCaptureTab("voice")}
        >
          语音解析
        </button>
      </div>
      {photoMode ? (
        <section className="upload">
          <div className="upload-dropzone">
            <AssetImage name={captureTab === "camera" ? "take-photo.png" : "choose-from-album.png"} alt="" className="upload-guide-image" />
            <h2>
              {captureTab === "camera"
                ? "拍下冰箱或食材"
                : "从相册选照片"}
            </h2>
            <p>
              {captureTab === "camera"
                ? "尽量拍清楚一点，我会认得更准。"
                : "一次可以选多张。"}
            </p>
          </div>
          <div className="upload-heading">
            <span>已选择图片</span>
            <p className="upload-count">{count} / 5</p>
          </div>
          {count > 0 && (
            <div className="thumbs">
              {Array.from({ length: count }).map((_, i) => (
                <span className="upload-thumb" key={i}>
                  <Placeholder />
                  <button
                    aria-label={`删除第 ${i + 1} 张照片`}
                    onClick={() =>
                      setPhotos((a) => ({
                        ...a,
                        [photoMode]: Math.max(0, a[photoMode] - 1),
                      }))
                    }
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="upload-actions">
            <button
              className="secondary"
              disabled={count >= 5}
              onClick={() =>
                setPhotos((a) => ({
                  ...a,
                  [photoMode]: Math.min(5, a[photoMode] + 1),
                }))
              }
            >
              {count >= 5
                ? "已达上限"
                : captureTab === "camera"
                  ? count
                    ? "继续拍照"
                    : "拍照"
                  : "浏览相册照片"}
            </button>
            {count > 0 && (
              <button
                className="link"
                onClick={() => setPhotos((a) => ({ ...a, [photoMode]: 0 }))}
              >
                {captureTab === "camera" ? "清空重拍" : "清空照片"}
              </button>
            )}
          </div>
        </section>
      ) : (
        <section className="voice-parse">
          <button
            className={`voice-trigger ${listening ? "listening" : ""}`}
            aria-label={listening ? "完成语音录入" : "开始语音录入"}
            onClick={() => {
              if (listening) {
                setInput("买了西红柿 2 个、鸡蛋 1 盒、牛肉半斤");
                setListening(false);
              } else setListening(true);
            }}
          >
            <AssetImage name="voice-analysis.png" alt="" className="voice-trigger-image" />
          </button>
          <h2>{listening ? "我在听……" : "轻点麦克风，口述刚刚买的食材"}</h2>
          <div className="voice-result">
            <strong id="voice-result-label">语音解析结果：</strong>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="语音结果会显示在这里，也可以直接修改"
              aria-labelledby="voice-result-label"
            />
            <button
              className="primary"
              disabled={!input}
              onClick={() => go("recognize")}
            >
              <span className="ui-icon" aria-hidden="true">✓</span>
              确认填入食材
            </button>
          </div>
        </section>
      )}
      {photoMode && (
        <>
          <div className="voice-box">
            <AssetImage name="text-input.png" alt="" className="text-input-icon" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="也可以直接告诉我家里有什么……"
              aria-label="补充说明"
            />
          </div>
          <button className="primary sticky" onClick={() => go("recognize")}>
            开始识别
          </button>
        </>
      )}
    </>
  );
}
