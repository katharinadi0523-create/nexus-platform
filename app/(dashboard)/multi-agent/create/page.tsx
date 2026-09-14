"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MultiAgentDetailWorkbench } from "@/components/agent/multi-agent-detail-workbench";
import {
  getMultiAgentBlankCreateDetail,
  getMultiAgentCreateDetail,
} from "@/lib/mock/multi-agent-create";
import { getPublishedMultiAgentById } from "@/lib/published-multi-agents";
import type { ClawDetailData } from "@/lib/mock/claw-hub-next";
import type { ImportDraftResult } from "@/components/import-export/import-draft-notice";

function buildMultiAgentDetail(id: string | null): ClawDetailData {
  // 新建：空白初始态（无子智能体、主智能体提示词为空）
  if (!id) {
    const blank = getMultiAgentBlankCreateDetail();
    return {
      ...blank,
      overview: {
        ...blank.overview,
        id: `multi-agent-${Date.now()}`,
        name: "未命名多智能体",
        publishStatus: "未发布",
        securityLevel: "公开",
        approvalStatus: "none",
      },
    };
  }

  // 编辑已有项：保留科研模板中的子智能体与配置
  const base = getMultiAgentCreateDetail();
  const published = getPublishedMultiAgentById(id);
  if (!published) {
    if (id === "imported-industry-research") {
      return {
        ...base,
        overview: {
          ...base.overview,
          id,
          name: "行业研究协作组",
          summary: "由主智能体调度检索、分析与报告生成三个子智能体。",
          publishStatus: "未发布",
        },
      };
    }
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
      securityLevel: published.securityLevel,
      approvalStatus: published.approvalStatus ?? "none",
    },
  };
}

function MultiAgentCreatePageContent() {
  const searchParams = useSearchParams();
  const agentId = searchParams.get("id");
  const importResultParam = searchParams.get("importResult");
  const importResult: ImportDraftResult | null =
    importResultParam === "success" || importResultParam === "success_with_warnings"
      ? importResultParam
      : null;
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

  return <MultiAgentDetailWorkbench key={workbenchKey} detail={detail} importResult={importResult} />;
}

/**
 * 多智能体创建 / 配置页
 * - 新建：/multi-agent/create
 * - 从列表进入已发布项：/multi-agent/create?id=xxx
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
