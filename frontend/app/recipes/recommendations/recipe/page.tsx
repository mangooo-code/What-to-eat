"use client";
import { Suspense } from "react";
import { RecommendRecipePage } from "../../../pages/RecommendRecipePage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <RecommendRecipePage />
    </Suspense>
  );
}
