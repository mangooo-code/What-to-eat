"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Legacy /recommend URL: redirect to its new route.
export default function Page() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/recipes/suggestions");
  }, [router]);
  return null;
}
