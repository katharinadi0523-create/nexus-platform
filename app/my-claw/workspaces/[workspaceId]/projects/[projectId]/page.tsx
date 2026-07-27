"use client";

import { use, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface LegacyProjectRoutePageProps {
  params: Promise<{
    workspaceId: string;
    projectId: string;
  }>;
}

/** Legacy deep link → /my-claw/projects/[projectId] preserving query. */
export default function LegacyProjectRoutePage({
  params,
}: LegacyProjectRoutePageProps) {
  const { projectId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const qs = searchParams.toString();
    const href = qs
      ? `/my-claw/projects/${projectId}?${qs}`
      : `/my-claw/projects/${projectId}`;
    router.replace(href);
  }, [projectId, router, searchParams]);

  return (
    <div className="flex h-full items-center justify-center text-[13px] text-[#5a6779]">
      正在跳转到新的 Project 路由…
    </div>
  );
}
