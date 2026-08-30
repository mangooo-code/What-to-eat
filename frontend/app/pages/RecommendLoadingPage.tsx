"use client";
import { LoadingSequence } from "../components/LoadingSequence";

const texts = [
  "让我想想今天吃什么好……",
  "先看看家里有什么能用的",
  "不爱吃的，我都帮你避开",
  "再挑几道今天最合适的",
];

export function RecommendLoadingPage() {
  return <LoadingSequence texts={texts} />;
}
