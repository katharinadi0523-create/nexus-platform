"use client";

import { useEffect, useRef } from "react";

export default function AIAssetsAppMarketplacePage() {
  const hasRedirected = useRef(false);

  useEffect(() => {
    // 使用 ref 确保只跳转一次，避免循环跳转
    // 使用 window.location.href 进行完整页面跳转，避免 Next.js 路由导致的频闪
    if (!hasRedirected.current) {
      hasRedirected.current = true;
      // 延迟跳转，给用户一个短暂的视觉反馈
      const timer = setTimeout(() => {
        window.location.href = "/app-marketplace";
      }, 50);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-500">正在跳转到应用广场...</p>
    </div>
  );
}
