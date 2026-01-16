import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // 忽略 ESLint 检查（防止卡死）
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 忽略 TypeScript 错误（防止卡死）
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;