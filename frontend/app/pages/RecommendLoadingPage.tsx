"use client";
import { LoadingSequence } from "../components/LoadingSequence";

const texts = [
  "看看今天适合吃点什么……",
  "正在看看冰箱里有什么",
  "正在避开大家不吃的东西",
  "再挑几道今天做起来刚刚好",
];

export function RecommendLoadingPage() {
  return <LoadingSequence texts={texts} />;
}
