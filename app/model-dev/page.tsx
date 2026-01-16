"use client";

import { Construction } from "lucide-react";

export default function ModelDevPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-60px)] space-y-6 pt-[60px]">
      <div className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center">
        <Construction className="w-16 h-16 text-blue-600" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900">
        模型开发平台 即将推出
      </h1>
      <p className="text-lg text-gray-600 text-center max-w-md">
        正在开发中，敬请期待
      </p>
    </div>
  );
}
