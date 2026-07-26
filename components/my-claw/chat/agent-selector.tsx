"use client";

import Link from "next/link";
import { Bot, Check, ChevronDown, Plus, X } from "lucide-react";
import { useMyClaw } from "@/components/my-claw/provider";
import {
  getEnterpriseAgentById,
  getEnterpriseAgentOptions,
} from "@/lib/mock/my-claw/agents";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface MyClawAgentOption {
  id: string;
  name: string;
  description?: string;
}

/** Research sub-agents (Task 5) — kept for summon chips, not plaza cards. */
const RESEARCH_SUB_AGENT_OPTIONS: MyClawAgentOption[] = [
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

const PERSONAL_OPTION: MyClawAgentOption = {
  id: "my-claw-personal",
  name: "我的Claw",
  description: "个人办公助手",
};

/** Consolidated catalog: plaza agents + research sub-agents + personal claw. */
export const MY_CLAW_AGENT_CATALOG: MyClawAgentOption[] = [
  PERSONAL_OPTION,
  ...getEnterpriseAgentOptions(),
  ...RESEARCH_SUB_AGENT_OPTIONS,
];

function resolveAgent(id: string): MyClawAgentOption {
  if (id === PERSONAL_OPTION.id) return PERSONAL_OPTION;

  const fromPlaza = getEnterpriseAgentById(id);
  if (fromPlaza) {
    return {
      id: fromPlaza.id,
      name: fromPlaza.name,
      description: fromPlaza.description,
    };
  }

  return (
    RESEARCH_SUB_AGENT_OPTIONS.find((agent) => agent.id === id) ??
    MY_CLAW_AGENT_CATALOG.find((agent) => agent.id === id) ?? {
      id,
      name: id,
    }
  );
}

/**
 * Composer-footer agent dropdown — matches 会话交互 `#composerAgentButton` pattern
 * (skill-adjacent pill + listbox menu +「召唤其他智能体」).
 */
export function AgentSelector({ className }: { className?: string }) {
  const {
    summonedAgentIds,
    selectedAgentId,
    setSelectedAgentId,
    dismissAgent,
  } = useMyClaw();

  const personalId = PERSONAL_OPTION.id;
  const effectiveSelected = selectedAgentId ?? personalId;
  const selectedAgent = resolveAgent(effectiveSelected);
  const options = [
    resolveAgent(personalId),
    ...summonedAgentIds
      .filter((id) => id !== personalId)
      .map((id) => resolveAgent(id)),
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-haspopup="listbox"
          className={cn(
            "inline-flex h-9 max-w-[220px] items-center gap-2 rounded-full border border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50",
            effectiveSelected !== personalId && "border-[#2773ff]/40 bg-[#e8f0fb] text-[#2773ff]",
            className
          )}
        >
          <Bot className="h-4 w-4 shrink-0" />
          <span className="truncate">{selectedAgent.name}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="start"
        sideOffset={8}
        className="w-[280px] rounded-xl border-slate-200 p-1.5 shadow-lg"
      >
        <DropdownMenuLabel className="px-2 py-1.5 text-xs font-medium text-slate-500">
          已召唤智能体
        </DropdownMenuLabel>
        {options.map((agent) => {
          const selected = effectiveSelected === agent.id;
          const dismissible = agent.id !== personalId;
          return (
            <DropdownMenuItem
              key={agent.id}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2",
                selected && "bg-[#e8f0fb] text-[#2773ff] focus:bg-[#e8f0fb] focus:text-[#2773ff]"
              )}
              onSelect={() =>
                setSelectedAgentId(agent.id === personalId ? null : agent.id)
              }
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                <Bot className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{agent.name}</span>
                {agent.description ? (
                  <span className="block truncate text-xs text-slate-500">{agent.description}</span>
                ) : null}
              </span>
              {selected ? <Check className="h-4 w-4 shrink-0 text-[#2773ff]" /> : null}
              {dismissible ? (
                <button
                  type="button"
                  aria-label={`移除 ${agent.name}`}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    dismissAgent(agent.id);
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator className="my-1.5" />
        <DropdownMenuItem asChild className="rounded-lg px-2 py-2">
          <Link
            href="/my-claw/agents"
            className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#2773ff]"
          >
            <Plus className="h-4 w-4" />
            召唤其他智能体
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
