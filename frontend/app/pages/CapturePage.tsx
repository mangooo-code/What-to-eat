"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "../styles/pages/capture.css";
import "../styles/components/tabs.css";
import { useApp } from "../context/AppContext";
import { Header } from "../components/Header";
import { AssetImage } from "../components/AssetImage";

export function CapturePage() {
  const {
    captureTab,
    setCaptureTab,
    photos,
    setPhotos,
    setFoods,
    listening,
    setListening,
    setInput,
    fridgePlace,
    say,
    go,
  } = useApp();
  const [previewUrl, setPreviewUrl] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const cameraInput = useRef<HTMLInputElement>(null);
  const albumInput = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isPhotoTab = captureTab !== "voice";
  const hasPhoto = Boolean(previewUrl);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const recognizedFoods = () => [
    { name: "番茄", qty: 2, unit: "个", place: fridgePlace, source: "recognition" as const },
    { name: "鸡蛋", qty: 1, unit: "盒", place: fridgePlace, source: "recognition" as const },
  ];

  const prepareRecognizedFoods = () => recognizedFoods().map((food) => ({ ...food, days: 0 }));

  const acceptPhoto = (blob: Blob, source: "camera" | "album") => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(blob));
    setPhotos({ camera: source === "camera" ? 1 : 0, album: source === "album" ? 1 : 0 });
  };

  const choosePhoto = (file: File | undefined, source: "camera" | "album") => {
    if (!file) return;
    acceptPhoto(file, source);
  };

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  };

  const openCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      openPhotoPicker(cameraInput.current);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);
    } catch {
      say("无法访问摄像头，请检查权限设置或改用照片上传。");
      openPhotoPicker(cameraInput.current);
    }
  };

  useEffect(() => {
    if (cameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraOpen]);

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) acceptPhoto(blob, "camera");
      closeCamera();
    }, "image/jpeg", 0.92);
  };

  const openPhotoPicker = (input: HTMLInputElement | null) => {
    if (!input) return;
    input.value = "";
    input.click();
  };

  const clearPhoto = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
    setPhotos({ camera: 0, album: 0 });
    if (cameraInput.current) cameraInput.current.value = "";
    if (albumInput.current) albumInput.current.value = "";
  };
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
          aria-selected={isPhotoTab}
          className={isPhotoTab ? "active" : ""}
          onClick={() => {
            setCaptureTab("camera");
            openCamera();
          }}
        >
          拍照识别
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={captureTab === "voice"}
          className={captureTab === "voice" ? "active" : ""}
          onClick={() => setCaptureTab("voice")}
        >
          语音识别
        </button>
      </div>
      <input ref={cameraInput} aria-label="拍照文件输入" className="visually-hidden" type="file" accept="image/*" capture="environment" onChange={(e) => choosePhoto(e.target.files?.[0], "camera")} />
      <input ref={albumInput} aria-label="相册文件输入" className="visually-hidden" type="file" accept="image/*" onChange={(e) => choosePhoto(e.target.files?.[0], "album")} />
      {cameraOpen && typeof document !== "undefined" && createPortal(
        <div className="overlay" role="dialog" aria-modal="true" aria-label="拍照">
          <div className="dialog camera-dialog">
            <video ref={videoRef} autoPlay playsInline muted className="camera-preview" />
            <div className="camera-actions">
              <button type="button" className="secondary" onClick={closeCamera}>取消</button>
              <button type="button" className="primary shutter-button" onClick={capturePhoto}>拍摄</button>
            </div>
          </div>
        </div>,
        document.body,
      )}
      {isPhotoTab ? (
        <section className="upload">
          <div className="upload-dropzone">
            {previewUrl ? (
              <img src={previewUrl} alt="待识别食材预览" className="photo-preview" />
            ) : (
              <AssetImage name="take-photo.png" alt="" className="upload-guide-image" />
            )}
            <h2>{previewUrl ? "照片已添加" : "添加一张食材照片"}</h2>
            <p>目前仅支持上传一张照片，尽量拍清楚一点。</p>
          </div>
          <div className="upload-actions">
            <div className="photo-source-actions">
              <button type="button" className="secondary" onClick={openCamera}>
                拍照
              </button>
              <button type="button" className="secondary" onClick={() => openPhotoPicker(albumInput.current)}>
                从相册选择
              </button>
            </div>
            {hasPhoto && (
              <button className="link" onClick={clearPhoto}>删除照片</button>
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
                const transcript = "买了西红柿 2 个、鸡蛋 1 盒、牛肉半斤";
                setInput(transcript);
                setListening(false);
                setFoods(prepareRecognizedFoods());
                go("recognize");
              } else setListening(true);
            }}
          >
            <AssetImage name="voice-analysis.png" alt="" className="voice-trigger-image" />
          </button>
          <h2>{listening ? "我在听……" : "轻点麦克风，口述刚刚买的食材"}</h2>
        </section>
      )}
      {isPhotoTab && (
        <>
          <button type="button" className="primary sticky" disabled={!hasPhoto} onClick={() => {
            setFoods(prepareRecognizedFoods());
            go("recognize");
          }}>
            开始识别
          </button>
        </>
      )}
    </>
  );
}
