"use client";

import { usePathname } from "next/navigation";
import { Construction } from "lucide-react";

const platformNames: Record<string, string> = {
  "/model-dev": "模型开发平台",
  "/data-gov": "多模态数据治理平台",
  "/vision": "视觉应用平台",
  "/office": "办公应用",
  "/base-control": "基础管控平台",
};

export default function ComingSoonPage() {
  const pathname = usePathname();
  const platformName = platformNames[pathname] || "该平台";

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-60px)] space-y-6 pt-[60px]">
      <div className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center">
        <Construction className="w-16 h-16 text-blue-600" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900">
        {platformName} 即将推出
      </h1>
      <p className="text-lg text-gray-600 text-center max-w-md">
        正在开发中，敬请期待
      </p>
    </div>
  );
}
