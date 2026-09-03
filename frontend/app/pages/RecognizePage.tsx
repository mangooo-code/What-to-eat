"use client";
import { useEffect, useRef } from "react";
import "../styles/components/loading.css";
import { AssetImage } from "../components/AssetImage";
import { useApp } from "../context/AppContext";
import { getRecognitionErrorMessage, recognitionService } from "../services/recognitionService";

export function RecognizePage() {
  const { recognitionImageFile, setFoods, fridgePlace, say, go } = useApp();
  const requestStartedRef = useRef(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    if (requestStartedRef.current) {
      return () => {
        mountedRef.current = false;
      };
    }
    requestStartedRef.current = true;

    if (!recognitionImageFile) {
      go("capture");
      return () => {
        mountedRef.current = false;
      };
    }

    void recognitionService.recognizeIngredients(recognitionImageFile).then((result) => {
      if (!mountedRef.current) return;
      setFoods(result.items.map((item) => ({
        name: item.name,
        normalizedName: item.normalizedName,
        qty: item.quantity ?? 1,
        unit: item.unit ?? "个",
        place: fridgePlace,
        days: null,
        source: "recognition" as const,
      })));
      go("confirm");
    }).catch((error) => {
      if (!mountedRef.current) return;
      say(getRecognitionErrorMessage(error));
      go("capture");
    });

    return () => {
      mountedRef.current = false;
    };
  }, [fridgePlace, go, recognitionImageFile, say, setFoods]);

  return (
    <div className="center-state" role="status" aria-live="polite">
      <AssetImage name="ai-identifying-ingredients.png" alt="" className="asset-state recognition-state-image" />
      <h1>让我仔细看看……</h1>
      <p>稍等一下，很快就好。</p>
    </div>
  );
}
