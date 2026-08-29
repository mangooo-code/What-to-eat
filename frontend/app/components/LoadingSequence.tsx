"use client";
import "../styles/components/loading.css";
import { useEffect, useState } from "react";
import { Placeholder } from "./Placeholder";

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
      <p>正在为这一顿缩小选择范围。</p>
      <Placeholder wide />
    </div>
  );
}
