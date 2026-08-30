"use client";
import "../styles/components/loading.css";
import { AssetImage } from "./AssetImage";
import { useEffect, useState } from "react";

export function LoadingSequence({ texts }: { texts: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(
      () => setI((x) => Math.min(x + 1, texts.length - 1)),
      1000,
    );
    return () => clearInterval(t);
  }, [texts.length]);
  return (
    <div className="center-state loading-state">
      <span className="spinner" />
      <h1>{texts[i]}</h1>
      <p>快选好啦，再等我一下。</p>
      <AssetImage name="ai-decision-loading.png" alt="开饭猫正在帮你挑选菜谱" className="asset-state ai-loading-image" />
    </div>
  );
}
