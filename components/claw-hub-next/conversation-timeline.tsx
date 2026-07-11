"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Loader2,
  Paperclip,
  Plug,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";
import type { ConversationTimelineActionStatus, ConversationTimelineItem } from "@/components/claw-hub-next/detail/utils";
import { cn } from "@/lib/utils";

function MiniStatusIcon({ status }: { status: ConversationTimelineActionStatus }) {
  if (status === "done") {
    return <CheckCircle2 className="h-4 w-4 text-slate-600" />;
  }

  if (status === "running") {
    return <Loader2 className="h-4 w-4 animate-spin text-slate-500" />;
  }

  return <Circle className="h-4 w-4 text-slate-300" />;
}

function getActionStatusText(status: ConversationTimelineActionStatus) {
  if (status === "done") {
    return "已完成";
  }

  if (status === "running") {
    return "执行中";
  }

  return "执行失败";
}

export function ClawUserMessage({ item }: { item: Extract<ConversationTimelineItem, { type: "user" }> }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-3xl rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
        {item.message.attachments?.length ? (
          <div className="mb-2.5 flex flex-wrap gap-2">
            {item.message.attachments.map((attachment) => (
              <span
                key={`${item.key}-${attachment}`}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600"
              >
                <Paperclip className="h-3.5 w-3.5" />
                <span>{attachment}</span>
              </span>
            ))}
          </div>
        ) : null}
        <p className="text-[15px] leading-6 text-slate-700">{item.message.content}</p>
      </div>
    </div>
  );
}

export function ClawAgentThinking({ item }: { item: Extract<ConversationTimelineItem, { type: "thinking" }> }) {
  const Icon = item.active ? Loader2 : Sparkles;

  return (
    <div className="flex items-start gap-2.5 px-1">
      <Icon
        className={cn(
          "mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400",
          item.active && "animate-spin"
        )}
      />
      <p className="text-sm leading-6 text-gray-500">{item.message.content}</p>
    </div>
  );
}

export function ClawAgentAction({
  item,
  expanded,
  onToggle,
  children,
}: {
  item: Extract<ConversationTimelineItem, { type: "action" }>;
  expanded: boolean;
  onToggle: () => void;
  children?: ReactNode;
}) {
  const Icon = item.kind === "skill" ? Wrench : item.kind === "user" ? Users : Plug;
  const canExpand = item.logs.length > 0 || Boolean(children);

  return (
    <article className="py-1">
      <button
        type="button"
        onClick={canExpand ? onToggle : undefined}
        disabled={!canExpand}
        className={cn(
          "flex w-full items-center justify-between gap-4 text-left",
          !canExpand && "cursor-default"
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <Icon className="h-[18px] w-[18px] shrink-0 text-slate-500" />
          <h3 className="truncate text-[15px] font-medium text-slate-800">{item.title}</h3>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <MiniStatusIcon status={item.status} />
            <span>{getActionStatusText(item.status)}</span>
          </div>
          {canExpand ? (
            <span className="inline-flex items-center text-slate-400">
              <ChevronDown className={cn("h-3.5 w-3.5 transition", expanded && "rotate-180")} />
            </span>
          ) : null}
        </div>
      </button>

      {expanded && canExpand ? (
        <div className="mt-3 border-l border-slate-200 pl-4">
          {children ? (
            children
          ) : (
            <div className="space-y-2">
              {item.logs.map((log) => (
                <p key={`${item.key}-${log}`} className="text-sm leading-6 text-slate-600">
                  {log}
                </p>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </article>
  );
}

export function ClawAgentOutput({
  item,
}: {
  item: Extract<ConversationTimelineItem, { type: "output" }>;
}) {
  return (
    <div className="px-1">
      <p className="text-sm leading-6 whitespace-pre-line text-slate-800">{item.message.content}</p>
      {item.message.attachments?.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {item.message.attachments.map((attachment) => (
            <span
              key={`${item.key}-${attachment}`}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
            >
              <Paperclip className="h-3.5 w-3.5" />
              <span>{attachment}</span>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ClawSubAgentSummonedEvent({ agentName, running = false }: { agentName: string; running?: boolean }) {
  return (
    <div className={cn("subagent-event-shell max-w-2xl rounded-lg p-px", running && "is-running")}>
      <div className="flex items-center gap-3 rounded-[7px] bg-white px-4 py-2.5">
        <Users className="h-4 w-4 shrink-0 text-slate-500" />
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">{agentName}</p>
        <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
      </div>
    </div>
  );
}

export function ClawConversationTimeline({
  items,
}: {
  items: ConversationTimelineItem[];
}) {
  const actionItems = useMemo(
    () => items.filter((item): item is Extract<ConversationTimelineItem, { type: "action" }> => item.type === "action"),
    [items]
  );
  const defaultExpanded = useMemo(
    () =>
      actionItems.reduce<Record<string, boolean>>((accumulator, item, index) => {
        accumulator[item.key] = index === actionItems.length - 1;
        return accumulator;
      }, {}),
    [actionItems]
  );
  const [expandedActions, setExpandedActions] = useState<Record<string, boolean>>(defaultExpanded);

  useEffect(() => {
    setExpandedActions(defaultExpanded);
  }, [defaultExpanded]);

  return (
    <div className="space-y-4">
      {items.map((item) => {
        if (item.type === "user") {
          return <ClawUserMessage key={item.key} item={item} />;
        }

        if (item.type === "thinking") {
          return <ClawAgentThinking key={item.key} item={item} />;
        }

        if (item.type === "action") {
          return (
            <ClawAgentAction
              key={item.key}
              item={item}
              expanded={Boolean(expandedActions[item.key])}
              onToggle={() =>
                setExpandedActions((current) => ({
                  ...current,
                  [item.key]: !current[item.key],
                }))
              }
            />
          );
        }

        return <ClawAgentOutput key={item.key} item={item} />;
      })}
    </div>
  );
}
