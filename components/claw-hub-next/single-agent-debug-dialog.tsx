"use client";

import { useMemo, useState } from "react";
import { Bot, RotateCcw } from "lucide-react";
import { ClawInteractiveChatPanel } from "@/components/claw-hub-next/interactive-chat-panel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { CapabilityAgentItem, ChatSessionItem, ClawDetailData } from "@/lib/mock/claw-hub-next";
import { cn } from "@/lib/utils";

type SingleAgentDebugDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: CapabilityAgentItem | null;
  clawDetail: ClawDetailData;
};

type SingleAgentDebugPanelProps = {
  agent: CapabilityAgentItem;
  clawDetail: ClawDetailData;
  className?: string;
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
  if (agent.id.startsWith("third-party:")) {
    return {
      id: `${agent.id}-debug-session`,
      title: agent.name,
      source: "调试",
      preview: "",
      updatedAt: "",
      unreadCount: 0,
      messages: [{
        id: `${agent.id}-example-reply`,
        role: "assistant",
        sender: agent.name,
        time: "",
        displayMode: "output",
        content: "原型示例回复：已收到你的消息。接入真实服务后，这里将展示该 Agent 的回复。",
      }],
    };
  }
  const resources = agent.resources ?? { skills: [], tools: [], knowledge: [] };
  const isThirdPartyReference = agent.sourceType === "referenced";
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
      content: isThirdPartyReference
        ? `已读取平台登记的 API 接口与认证配置，正在向${agent.name}发起独立调试请求。`
        : `已读取提示词与资源配置，正在规划${agent.name}的单智能体执行流程。`,
    },
    ...(isThirdPartyReference ? [{
      id: `${agent.id}-debug-api-call`,
      role: "tool" as const,
      sender: "API 调用",
      time: "刚刚",
      displayMode: "tool" as const,
      toolLabel: `调用 ${agent.name}`,
      content: `已按 ${agent.primaryModel ?? "API"} 接口规范发送任务，服务地址、认证信息与请求结构均使用平台登记配置。`,
    }] : []),
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
      content: isThirdPartyReference
        ? `第三方 Agent 独立调试已完成。${agent.description} 返回内容已由平台按登记的 API 接口规范解析。`
        : `单智能体调试已完成。${agent.description} 当前模型、提示词和已挂载资源均已进入本次执行链路。`,
    },
  ];

  return {
    id: `${agent.id}-debug-session`,
    title: `${agent.name}${isThirdPartyReference ? "独立调试" : "单智能体调试"}`,
    source: "资源配置",
    preview: messages[0]?.content ?? "",
    updatedAt: "刚刚",
    unreadCount: 0,
    messages,
  };
}

export function SingleAgentDebugPanel({ agent, clawDetail, className }: SingleAgentDebugPanelProps) {
  const [sessionKey, setSessionKey] = useState(0);
  const isThirdParty = agent.id.startsWith("third-party:");
  const debugDetail = useMemo(
    () => buildAgentDebugDetail(agent, clawDetail),
    [agent, clawDetail]
  );
  const debugSession = useMemo(() => buildAgentDebugSession(agent), [agent]);

  return (
    <section className={cn("flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white", className)}>
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 px-5 text-left">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600"><Bot className="h-4 w-4" /></span>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-slate-900">预览调试 · {agent.name}</h2>
            {!isThirdParty ? <p className="mt-0.5 truncate text-xs text-slate-500">
              {agent.sourceType === "referenced"
                ? `${agent.primaryModel ?? "API"} · 使用平台已登记接入配置`
                : `${agent.primaryModel ?? "未配置主力模型"}${agent.fallbackModel ? ` · Fallback ${agent.fallbackModel}` : ""}`}
            </p> : null}
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" className="h-8 border-slate-200 text-slate-600" onClick={() => setSessionKey((current) => current + 1)}>
          <RotateCcw className="h-3.5 w-3.5" />清空
        </Button>
      </header>
      <div className="min-h-0 flex-1 overflow-hidden">
        <ClawInteractiveChatPanel key={`${agent.id}-${sessionKey}`} detail={debugDetail} session={debugSession} inspectorMode={isThirdParty ? "closed" : "open"} simpleChat={isThirdParty} />
      </div>
    </section>
  );
}

export function SingleAgentDebugDialog({ open, onOpenChange, agent, clawDetail }: SingleAgentDebugDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[min(860px,calc(100vh-32px))] w-[min(1400px,calc(100vw-32px))] max-w-none overflow-hidden border-slate-200 p-0">
        <DialogHeader className="sr-only"><DialogTitle>{agent ? `调试 ${agent.name}` : "智能体调试"}</DialogTitle></DialogHeader>
        {agent ? <SingleAgentDebugPanel agent={agent} clawDetail={clawDetail} className="h-full rounded-none border-0" /> : null}
      </DialogContent>
    </Dialog>
  );
}
