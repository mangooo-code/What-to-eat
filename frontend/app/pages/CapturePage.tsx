"use client";
import "../styles/pages/capture.css";
import "../styles/components/tabs.css";
import { useApp } from "../context/AppContext";
import { Header } from "../components/Header";
import { Placeholder } from "../components/Placeholder";

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
        title="家里还有什么？"
        sub="拍张照片最快，也可以直接告诉我。"
        back={() => go("fridge")}
      />
      <div className="tabs capture-tabs">
        <button
          className={captureTab === "camera" ? "active" : ""}
          onClick={() => setCaptureTab("camera")}
        >
          <Placeholder kind="icon" />
          拍一张
        </button>
        <button
          className={captureTab === "album" ? "active" : ""}
          onClick={() => setCaptureTab("album")}
        >
          <Placeholder kind="icon" />
          从相册选
        </button>
        <button
          className={captureTab === "voice" ? "active" : ""}
          onClick={() => setCaptureTab("voice")}
        >
          <Placeholder kind="icon" />
          语音解析
        </button>
      </div>
      {photoMode ? (
        <section className="upload">
          <div className="upload-dropzone">
            <Placeholder kind="icon" />
            <h2>
              {captureTab === "camera"
                ? "对着冰箱或食材拍一张"
                : "点击打开手机 / 电脑相册"}
            </h2>
            <p>
              {captureTab === "camera"
                ? "拍摄冰箱或食材即可"
                : "支持多选食材照片"}
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
            onClick={() => {
              if (listening) {
                setInput("买了西红柿 2 个、鸡蛋 1 盒、牛肉半斤");
                setListening(false);
              } else setListening(true);
            }}
          >
            <Placeholder kind="icon" />
          </button>
          <h2>{listening ? "正在听……" : "轻点麦克风，口述刚刚买的食材"}</h2>
          <div className="voice-result">
            <strong>语音解析结果：</strong>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="语音结果会显示在这里，也可以直接修改"
            />
            <button
              className="primary"
              disabled={!input}
              onClick={() => go("recognize")}
            >
              <Placeholder kind="icon" />
              确认填入食材
            </button>
          </div>
        </section>
      )}
      {photoMode && (
        <>
          <div className="voice-box">
            <Placeholder kind="icon" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="也可以直接告诉我家里有什么……"
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
