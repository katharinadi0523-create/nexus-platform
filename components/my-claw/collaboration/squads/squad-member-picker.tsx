"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ACTOR_TYPE_LABELS,
  CURRENT_USER_ID,
  type AgentActor,
  type AgentActorType,
  type SquadAgentMember,
} from "@/lib/mock/my-claw/collaboration";
import { useCollaboration } from "../collaboration-provider";
import { ActorAvatar } from "../shared/actor-avatar";
import { ActorTypeBadge } from "../shared/actor-type-badge";

const TYPE_ORDER: AgentActorType[] = [
  "personal_claw",
  "platform_claw",
  "multi_agent_group",
];

const RUNTIME_LABELS: Record<AgentActor["runtimeStatus"], string> = {
  online: "在线",
  busy: "忙碌",
  offline: "离线",
  error: "异常",
};

export function memberStateForActor(
  actor: AgentActor
): SquadAgentMember["state"] {
  if (
    actor.type === "personal_claw" &&
    actor.ownerUserId &&
    actor.ownerUserId !== CURRENT_USER_ID
  ) {
    return "pending_consent";
  }
  return "active";
}

export function SquadMemberPicker({
  candidates,
  selectedIds,
  onToggle,
  className,
}: {
  candidates: AgentActor[];
  selectedIds: string[];
  onToggle: (actorId: string) => void;
  className?: string;
}) {
  const { getHumanForPersonalClaw } = useCollaboration();

  const grouped = TYPE_ORDER.map((type) => ({
    type,
    label: ACTOR_TYPE_LABELS[type],
    actors: candidates.filter((actor) => actor.type === type),
  })).filter((group) => group.actors.length > 0);

  if (grouped.length === 0) {
    return (
      <div
        className={cn(
          "rounded-lg border border-dashed border-slate-200 bg-[#f8f9fb] px-4 py-8 text-center text-sm text-[#5a6779]",
          className
        )}
      >
        当前空间暂无可选 Agent
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {grouped.map((group) => (
        <div key={group.type}>
          <div className="mb-2 text-[12px] font-medium text-[#5a6779]">
            {group.label}
          </div>
          <div className="space-y-1.5">
            {group.actors.map((actor) => {
              const selected = selectedIds.includes(actor.id);
              const needsConsent =
                memberStateForActor(actor) === "pending_consent";
              const human =
                actor.type === "personal_claw"
                  ? getHumanForPersonalClaw(actor.id)
                  : undefined;
              return (
                <button
                  key={actor.id}
                  type="button"
                  onClick={() => onToggle(actor.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                    selected
                      ? "border-[#2773ff]/40 bg-[#e8f0fb]"
                      : "border-slate-200/90 bg-white hover:bg-[#f8f9fb]"
                  )}
                >
                  <ActorAvatar name={actor.name} type={actor.type} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-[13px] font-medium text-slate-900">
                        {actor.name}
                      </span>
                      <ActorTypeBadge type={actor.type} />
                    </div>
                    {human ? (
                      <div className="mt-0.5 text-[11px] text-[#2773ff]">
                        将同时加入：{human.name}
                      </div>
                    ) : null}
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-[#5a6779]">
                      <span className="truncate">{actor.sourceLabel}</span>
                      <span>·</span>
                      <span>{RUNTIME_LABELS[actor.runtimeStatus]}</span>
                      {needsConsent ? (
                        <>
                          <span>·</span>
                          <span className="text-amber-700">需用户确认</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                  <div
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                      selected
                        ? "border-[#2773ff] bg-[#2773ff] text-white"
                        : "border-slate-300 bg-white"
                    )}
                  >
                    {selected ? <Check className="h-3 w-3" /> : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
