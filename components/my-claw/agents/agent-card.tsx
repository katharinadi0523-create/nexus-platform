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
  const actionLabel = selected ? "当前智能体" : summoned ? "切换" : "召唤";

  return (
    <article
      className={cn(
        "relative flex min-h-[290px] flex-col items-center overflow-hidden rounded-[18px] border border-[#dbeafe] bg-white px-5 pb-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition-shadow duration-200",
        "hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
      )}
    >
      <div className="mb-5 h-1 w-full bg-[#2773ff]" aria-hidden="true" />

      <button
        type="button"
        className={cn(
          "absolute right-3.5 top-3.5 z-[2] grid h-[34px] w-[34px] place-items-center rounded-full border bg-white transition",
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

      <div className="grid h-[72px] w-[72px] place-items-center rounded-full border border-[#dbeafe] bg-[#eff6ff] text-lg font-semibold text-[#2773ff]">
        {getAgentAvatarInitial(agent.name)}
      </div>

      <strong className="mt-4 block text-center text-base font-semibold text-slate-900">
        {agent.name}
      </strong>

      <p className="mt-2.5 line-clamp-2 min-h-[44px] text-center text-sm leading-[1.7] text-[#5a6779]">
        {agent.description}
      </p>

      {agent.tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
          {agent.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-[#f0f5ff] px-2 py-0.5 text-[11px] font-medium text-[#2f5fbf]"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-3.5 grid w-full grid-cols-2 gap-2">
        <div
          className="rounded-lg bg-[#f8fafc] px-2.5 py-2 text-center"
          title="使用量"
        >
          <div className="text-[11px] text-[#5a6779]">使用量</div>
          <div className="mt-0.5 text-sm font-semibold text-slate-900">
            {formatEnterpriseMetric(agent.usageCount)}
          </div>
        </div>
        <div
          className="rounded-lg bg-[#f8fafc] px-2.5 py-2 text-center"
          title="收藏量"
        >
          <div className="text-[11px] text-[#5a6779]">收藏量</div>
          <div className="mt-0.5 text-sm font-semibold text-slate-900">
            {formatEnterpriseMetric(agent.favoriteCount)}
          </div>
        </div>
      </div>

      <div className="mt-auto w-full pt-4">
        <div className="mb-3 h-px w-full bg-[#e8eef7]" />
        <button
          type="button"
          aria-pressed={selected}
          onClick={() => onSummon(agent.id)}
          className={cn(
            "inline-flex h-8 w-full items-center justify-center rounded-full text-sm font-medium transition",
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
