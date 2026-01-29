"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AIAssetsPage() {
  const router = useRouter();

  useEffect(() => {
    // 默认跳转到模型广场，避免应用广场的自动跳转导致频闪
    router.replace("/ai-assets/model-marketplace");
  }, [router]);

  // 返回一个有效的组件，避免 undefined 错误
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-gray-500">加载中...</div>
    </div>
  );
}
