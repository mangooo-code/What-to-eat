"use client";
import "../styles/components/loading.css";
import { AssetImage } from "./AssetImage";
import { useEffect, useState } from "react";

const HOLD_MS = 3000;
const TRANSITION_MS = 1000;

export function LoadingSequence({ texts }: { texts: string[] }) {
  const [i, setI] = useState(0);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    // Drives itself via nested setTimeout calls (rather than re-running this effect per
    // step) so the hold/transition chain isn't at the mercy of React's render/effect timing.
    let cancelled = false;
    let index = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const scheduleNext = () => {
      if (texts.length <= 1) return;
      timers.push(setTimeout(() => {
        if (cancelled) return;
        setVisible(false);
        timers.push(setTimeout(() => {
          if (cancelled) return;
          index = (index + 1) % texts.length;
          setI(index);
          setVisible(true);
          scheduleNext();
        }, TRANSITION_MS));
      }, HOLD_MS));
    };
    scheduleNext();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [texts.length]);
  return (
    <div className="center-state loading-state" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <h1 className={`loading-text${visible ? "" : " loading-text-hidden"}`}>{texts[i]}</h1>
      <p>快选好啦，再等我一下。</p>
      <AssetImage name="ai-decision-loading.png" alt="" className="asset-state ai-loading-image" />
    </div>
  );
}
