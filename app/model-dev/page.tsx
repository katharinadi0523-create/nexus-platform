"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ModelDevPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/model-dev/online-services");
  }, [router]);

  return null;
}
