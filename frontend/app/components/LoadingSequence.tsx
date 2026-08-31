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
    <div className="center-state loading-state" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <h1>{texts[i]}</h1>
      <p>快选好啦，再等我一下。</p>
      <AssetImage name="ai-decision-loading.png" alt="" className="asset-state ai-loading-image" />
    </div>
  );
}
