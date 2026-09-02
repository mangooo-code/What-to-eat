"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Legacy /recipes URL: redirect to the history tab's own route.
export default function Page() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/recipes/history");
  }, [router]);
  return null;
}
