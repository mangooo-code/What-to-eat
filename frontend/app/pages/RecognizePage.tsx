"use client";
import "../styles/components/loading.css";
import { AssetImage } from "../components/AssetImage";

export function RecognizePage() {
  return (
    <div className="center-state" role="status" aria-live="polite">
      <AssetImage name="ai-identifying-ingredients.png" alt="" className="asset-state recognition-state-image" />
      <h1>让我仔细看看……</h1>
      <p>稍等一下，很快就好。</p>
    </div>
  );
}
