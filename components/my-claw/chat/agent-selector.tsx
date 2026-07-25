"use client";

import Link from "next/link";
import { Bot, Plus, X } from "lucide-react";
import { useMyClaw } from "@/components/my-claw/provider";
import { cn } from "@/lib/utils";

export interface MyClawAgentOption {
  id: string;
  name: string;
  description?: string;
}

/** Minimal catalog for selector chips until Task agents plaza lands. */
export const MY_CLAW_AGENT_CATALOG: MyClawAgentOption[] = [
  {
    id: "my-claw-personal",
    name: "我的Claw",
    description: "个人办公助手",
  },
  {
    id: "prd-writer",
    name: "PRD写手",
    description: "整理可评审的 PRD",
  },
  {
    id: "ui-designer",
    name: "UI设计师",
    description: "信息架构与界面表达",
  },
  {
    id: "research-claw",
    name: "科研智能体",
    description: "多智能体科研协作",
  },
  {
    id: "research-claw-main",
    name: "科研智能体",
    description: "科研主智能体",
  },
  {
    id: "ra-hypothesis",
    name: "假设生成智能体",
    description: "生成可验证假设",
  },
  {
    id: "ra-literature",
    name: "文献检索智能体",
    description: "构建文献证据矩阵",
  },
  {
    id: "ra-viz",
    name: "科研绘图智能体",
    description: "制作科研图表包",
  },
  {
    id: "ra-paper",
    name: "论文生成智能体",
    description: "撰写研究论文",
  },
  {
    id: "ra-review",
    name: "论文审核智能体",
    description: "审核论文质量",
  },
];

function resolveAgent(id: string): MyClawAgentOption {
  return (
    MY_CLAW_AGENT_CATALOG.find((agent) => agent.id === id) ?? {
      id,
      name: id,
    }
  );
}

export function AgentSelector({ className }: { className?: string }) {
  const {
    summonedAgentIds,
    selectedAgentId,
    setSelectedAgentId,
    dismissAgent,
  } = useMyClaw();

  const personalId = "my-claw-personal";
  const effectiveSelected = selectedAgentId ?? personalId;
  const chips = [
    resolveAgent(personalId),
    ...summonedAgentIds
      .filter((id) => id !== personalId)
      .map((id) => resolveAgent(id)),
  ];

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {chips.map((agent) => {
        const selected = effectiveSelected === agent.id;
        const dismissible = agent.id !== personalId;

        return (
          <div
            key={agent.id}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-1 py-0.5",
              selected
                ? "border-[#2773ff]/40 bg-[#e8f0fb]"
                : "border-slate-200 bg-white"
            )}
          >
            <button
              type="button"
              onClick={() =>
                setSelectedAgentId(agent.id === personalId ? null : agent.id)
              }
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition",
                selected ? "text-[#2773ff]" : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <Bot className="h-3.5 w-3.5" />
              <span>{agent.name}</span>
            </button>
            {dismissible ? (
              <button
                type="button"
                aria-label={`移除 ${agent.name}`}
                onClick={() => dismissAgent(agent.id)}
                className="mr-1 flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-3 w-3" />
              </button>
            ) : null}
          </div>
        );
      })}

      <Link
        href="/my-claw/agents"
        className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-[#2773ff]/40 hover:bg-[#f5f8ff] hover:text-[#2773ff]"
      >
        <Plus className="h-3.5 w-3.5" />
        召唤其他智能体
      </Link>
    </div>
  );
}
