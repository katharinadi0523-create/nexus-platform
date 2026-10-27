"use client";

import { Star } from "lucide-react";
import {
  formatEnterpriseMetric,
  getAgentAvatarInitial,
  type EnterpriseAgent,
} from "@/lib/mock/my-claw/agents";
import { cn } from "@/lib/utils";

export interface AgentCardProps {
  agent: EnterpriseAgent;
  favorite: boolean;
  summoned: boolean;
  selected: boolean;
  onToggleFavorite: (agentId: string) => void;
  onSummon: (agentId: string) => void;
}

export function AgentCard({
  agent,
  favorite,
  summoned,
  selected,
  onToggleFavorite,
  onSummon,
}: AgentCardProps) {
  const actionLabel = selected ? "当前智能体" : summoned ? "切换" : "调用";

  return (
    <article
      className={cn(
        "relative flex min-h-[212px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-shadow duration-200",
        "hover:shadow-[0_8px_22px_rgba(15,23,42,0.07)]"
      )}
    >
      <button
        type="button"
        className={cn(
          "absolute right-3 top-3 z-[2] grid h-8 w-8 place-items-center rounded-md border bg-white transition",
          favorite
            ? "border-[#fde68a] bg-[#fffbeb] text-[#f59e0b]"
            : "border-slate-200 text-slate-400 hover:border-[#fcd34d] hover:text-[#f59e0b]"
        )}
        aria-label={favorite ? "取消收藏" : "收藏"}
        title={favorite ? "取消收藏" : "收藏"}
        onClick={() => onToggleFavorite(agent.id)}
      >
        <Star
          className="h-[18px] w-[18px]"
          fill={favorite ? "currentColor" : "none"}
          strokeWidth={1.35}
        />
      </button>

      <div className="flex min-w-0 items-start gap-3 pr-9">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#eef4ff] text-sm font-semibold text-[#2773ff]">
          {getAgentAvatarInitial(agent.name)}
        </div>
        <div className="min-w-0 flex-1">
          <strong className="block truncate pt-0.5 text-[15px] font-semibold leading-5 text-slate-900">
            {agent.name}
          </strong>
          <p className="mt-1.5 line-clamp-2 min-h-[40px] text-[13px] leading-5 text-slate-600">
            {agent.description}
          </p>
        </div>
      </div>

      {agent.tags.length > 0 ? (
        <div className="mt-3 flex min-h-6 flex-wrap items-center gap-1.5">
          {agent.tags.map((tag) => (
            <span
              key={tag}
              className="rounded bg-[#f1f5f9] px-2 py-1 text-[11px] font-medium text-slate-600"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : <div className="mt-3 min-h-6" />}

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-slate-500">
          <span>
            使用量 <strong className="ml-1 font-semibold text-slate-800">{formatEnterpriseMetric(agent.usageCount)}</strong>
          </span>
          <span>
            收藏量 <strong className="ml-1 font-semibold text-slate-800">{formatEnterpriseMetric(agent.favoriteCount)}</strong>
          </span>
        </div>
        <button
          type="button"
          aria-pressed={selected}
          onClick={() => onSummon(agent.id)}
          className={cn(
            "inline-flex h-8 min-w-[88px] shrink-0 items-center justify-center rounded-md px-3 text-[13px] font-medium transition",
            selected
              ? "bg-[#e8f0fb] text-[#2773ff] shadow-[0_0_0_1px_rgba(39,115,255,0.24)]"
              : "bg-[#2773ff] text-white hover:bg-[#1f63e6]"
          )}
        >
          {actionLabel}
        </button>
      </div>
    </article>
  );
}
