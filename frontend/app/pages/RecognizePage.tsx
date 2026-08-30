"use client";
import "../styles/components/loading.css";
import { AssetImage } from "../components/AssetImage";

export function RecognizePage() {
  return (
    <div className="center-state">
      <AssetImage name="ai-identifying-ingredients.png" alt="开饭猫正在识别食材" className="asset-state recognition-state-image" />
      <h1>让我仔细看看……</h1>
      <p>稍等一下，很快就好。</p>
    </div>
  );
}
