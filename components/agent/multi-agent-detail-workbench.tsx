"use client";

import { ClawDetailWorkbench } from "@/components/claw-hub-next/claw-detail-workbench";
import type { ClawDetailData } from "@/lib/mock/claw-hub-next";

/**
 * 多智能体配置工作台：复用 Claw 详情能力与对话调试组件，
 * 通过 mode="multi-agent" 隐藏顶栏开关、重命名侧栏、移除渠道。
 */
export function MultiAgentDetailWorkbench({
  detail,
}: {
  detail: ClawDetailData;
}) {
  return (
    <ClawDetailWorkbench
      detail={detail}
      mode="multi-agent"
      backHref="/agent"
      backAriaLabel="返回智能体列表"
    />
  );
}
