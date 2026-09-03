"use client";
import { Suspense } from "react";
import { SavedRecipePage } from "../../../pages/SavedRecipePage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SavedRecipePage />
    </Suspense>
  );
}
