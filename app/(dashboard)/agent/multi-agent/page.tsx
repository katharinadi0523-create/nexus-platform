"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MultiAgentDetailWorkbench } from "@/components/agent/multi-agent-detail-workbench";
import { getMultiAgentCreateDetail } from "@/lib/mock/multi-agent-create";
import { getPublishedMultiAgentById } from "@/lib/published-multi-agents";
import type { ClawDetailData } from "@/lib/mock/claw-hub-next";

function buildMultiAgentDetail(id: string | null): ClawDetailData {
  const base = getMultiAgentCreateDetail();

  if (!id) {
    return {
      ...base,
      overview: {
        ...base.overview,
        id: `multi-agent-${Date.now()}`,
        name: "未命名多智能体",
        publishStatus: "未发布",
      },
    };
  }

  const published = getPublishedMultiAgentById(id);
  if (!published) {
    return {
      ...base,
      overview: {
        ...base.overview,
        id,
      },
    };
  }

  return {
    ...base,
    overview: {
      ...base.overview,
      id: published.id,
      name: published.name,
      summary: published.desc,
      publishStatus: published.status,
    },
  };
}

function MultiAgentCreatePageContent() {
  const searchParams = useSearchParams();
  const agentId = searchParams.get("id");
  const [detail, setDetail] = useState<ClawDetailData | null>(null);

  useEffect(() => {
    setDetail(buildMultiAgentDetail(agentId));
  }, [agentId]);

  const workbenchKey = useMemo(
    () => detail?.overview.id ?? agentId ?? "multi-agent-new",
    [agentId, detail?.overview.id]
  );

  if (!detail) {
    return (
      <div className="flex h-full min-h-[240px] items-center justify-center text-sm text-slate-400">
        加载中…
      </div>
    );
  }

  return <MultiAgentDetailWorkbench key={workbenchKey} detail={detail} />;
}

/**
 * 多智能体创建 / 配置页
 * - 新建：/agent/multi-agent
 * - 从列表进入已发布项：/agent/multi-agent?id=xxx ，回显名称、描述与发布状态
 */
export default function MultiAgentCreatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full min-h-[240px] items-center justify-center text-sm text-slate-400">
          加载中…
        </div>
      }
    >
      <MultiAgentCreatePageContent />
    </Suspense>
  );
}
