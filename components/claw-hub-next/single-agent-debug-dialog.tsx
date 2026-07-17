"use client";

import { useMemo, useState } from "react";
import { Bot, RotateCcw } from "lucide-react";
import { ClawInteractiveChatPanel } from "@/components/claw-hub-next/interactive-chat-panel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { CapabilityAgentItem, ChatSessionItem, ClawDetailData } from "@/lib/mock/claw-hub-next";

type SingleAgentDebugDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: CapabilityAgentItem | null;
  clawDetail: ClawDetailData;
};

function buildAgentDebugDetail(agent: CapabilityAgentItem, clawDetail: ClawDetailData): ClawDetailData {
  const resources = agent.resources ?? { skills: [], tools: [], knowledge: [] };

  return {
    ...clawDetail,
    overview: {
      ...clawDetail.overview,
      id: agent.id,
      name: agent.name,
      scene: agent.description,
      model: agent.fallbackModel
        ? `${agent.primaryModel ?? clawDetail.overview.model} / ${agent.fallbackModel}`
        : agent.primaryModel ?? clawDetail.overview.model,
    },
    capabilityConfig: {
      tools: { platform: [], tenant: [], claw: resources.tools },
      skills: { platform: [], tenant: [], claw: resources.skills },
      agents: { platform: [], tenant: [], claw: [agent] },
      knowledge: { tenant: [], claw: resources.knowledge },
    },
  };
}

function buildAgentDebugSession(agent: CapabilityAgentItem): ChatSessionItem {
  const resources = agent.resources ?? { skills: [], tools: [], knowledge: [] };
  const messages: ChatSessionItem["messages"] = [
    {
      id: `${agent.id}-debug-user`,
      role: "user",
      sender: "调试用户",
      time: "刚刚",
      content: `请使用当前配置完成一次${agent.name}能力调试，并返回可验证的处理结果。`,
    },
    {
      id: `${agent.id}-debug-thinking`,
      role: "assistant",
      sender: agent.name,
      time: "刚刚",
      displayMode: "thinking",
      content: `已读取提示词与资源配置，正在规划${agent.name}的单智能体执行流程。`,
    },
    ...resources.skills.map((skill) => ({
      id: `${agent.id}-debug-skill-${skill.id}`,
      role: "tool" as const,
      sender: skill.name,
      time: "刚刚",
      displayMode: "skill" as const,
      toolLabel: `调用 ${skill.name}`,
      content: `已加载技能\n${skill.description}`,
    })),
    ...resources.tools.map((tool) => ({
      id: `${agent.id}-debug-tool-${tool.id}`,
      role: "tool" as const,
      sender: tool.name,
      time: "刚刚",
      displayMode: "tool" as const,
      toolLabel: `调用 ${tool.name}`,
      content: `工具执行成功\n${tool.description}`,
    })),
    ...resources.knowledge.map((knowledge) => ({
      id: `${agent.id}-debug-knowledge-${knowledge.id}`,
      role: "tool" as const,
      sender: knowledge.name,
      time: "刚刚",
      displayMode: "tool" as const,
      toolLabel: `检索 ${knowledge.name}`,
      content: `知识检索完成\n已从 ${knowledge.documentCount} 篇资料中获取与任务相关的上下文。`,
    })),
    {
      id: `${agent.id}-debug-output`,
      role: "assistant",
      sender: agent.name,
      time: "刚刚",
      displayMode: "output",
      content: `单智能体调试已完成。${agent.description} 当前模型、提示词和已挂载资源均已进入本次执行链路。`,
    },
  ];

  return {
    id: `${agent.id}-debug-session`,
    title: `${agent.name}单智能体调试`,
    source: "资源配置",
    preview: messages[0]?.content ?? "",
    updatedAt: "刚刚",
    unreadCount: 0,
    messages,
  };
}

export function SingleAgentDebugDialog({ open, onOpenChange, agent, clawDetail }: SingleAgentDebugDialogProps) {
  const [sessionKey, setSessionKey] = useState(0);
  const debugDetail = useMemo(
    () => (agent ? buildAgentDebugDetail(agent, clawDetail) : null),
    [agent, clawDetail]
  );
  const debugSession = useMemo(() => (agent ? buildAgentDebugSession(agent) : undefined), [agent]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(860px,calc(100vh-32px))] w-[min(1400px,calc(100vw-32px))] max-w-none flex-col gap-0 overflow-hidden border-slate-200 p-0">
        {agent && debugDetail ? (
          <>
            <DialogHeader className="flex h-14 shrink-0 flex-row items-center justify-between space-y-0 border-b border-slate-200 px-5 pr-12 text-left">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                  <Bot className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <DialogTitle className="truncate text-sm font-semibold text-slate-900">单智能体调试 · {agent.name}</DialogTitle>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {agent.primaryModel ?? "未配置主力模型"}
                    {agent.fallbackModel ? ` · Fallback ${agent.fallbackModel}` : ""}
                  </p>
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" className="h-8 border-slate-200 text-slate-600" onClick={() => setSessionKey((current) => current + 1)}>
                <RotateCcw className="h-3.5 w-3.5" />
                清空
              </Button>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-hidden">
              <ClawInteractiveChatPanel
                key={`${agent.id}-${sessionKey}`}
                detail={debugDetail}
                session={debugSession}
                inspectorMode="open"
              />
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
