import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // 忽略 TypeScript 错误（防止卡死）
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          "**/.git/**",
          "**/.next/**",
          "**/.vercel/**",
          "**/node_modules/**",
        ],
      };
    }

    return config;
  },
};

export default nextConfig;
