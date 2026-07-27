"use client";

import { useMemo, useState } from "react";
import {
  ClawAgentAction,
  ClawAgentOutput,
  ClawAgentThinking,
  ClawConversationTimeline,
  ClawSubAgentSummonedEvent,
  ClawUserMessage,
} from "@/components/claw-hub-next/conversation-timeline";
import type {
  ConversationMessageWithAudit,
  ConversationTimelineItem,
} from "@/components/claw-hub-next/detail/utils";
import type { AgentInvocationEvent } from "@/lib/mock/my-claw/project-conversation";
import { useProjectConversation } from "../project-conversation-provider";

interface ExecutionTimelineProps {
  events: AgentInvocationEvent[];
  onOpenDelegatedInvocation?: (invocationId: string) => void;
}

type TimelineSegment =
  | ConversationTimelineItem
  | { type: "delegation"; event: AgentInvocationEvent };

function toAuditMessage(
  id: string,
  content: string,
  sender: string,
  role: "user" | "assistant" = "assistant",
  attachments?: string[]
): ConversationMessageWithAudit {
  return {
    id,
    role,
    sender,
    time: "",
    content,
    attachments,
    auditRecords: [],
  };
}

function eventToSegment(event: AgentInvocationEvent): TimelineSegment | null {
  const display = event.display;
  if (!display) {
    return {
      key: event.id,
      type: "action",
      title: event.label,
      kind: event.kind === "skill" ? "skill" : "tool",
      status: event.kind === "error" ? "failed" : "done",
      logs: event.detail ? [event.detail] : [],
      source: "audit",
    };
  }

  if (display.type === "daemon") {
    return {
      key: event.id,
      type: "user",
      message: toAuditMessage(
        event.id,
        display.content ?? event.detail ?? event.label,
        "Daemon",
        "user",
        display.attachments
      ),
    };
  }

  if (display.type === "thinking") {
    return {
      key: event.id,
      type: "thinking",
      active: display.status === "running",
      message: toAuditMessage(
        event.id,
        display.content ?? event.label,
        "Agent"
      ),
    };
  }

  if (display.type === "output") {
    return {
      key: event.id,
      type: "output",
      message: toAuditMessage(
        event.id,
        display.content ?? event.label,
        "Agent",
        "assistant",
        display.attachments
      ),
    };
  }

  if (display.type === "delegation") {
    return { type: "delegation", event };
  }

  return {
    key: event.id,
    type: "action",
    title: event.label,
    kind: display.actionKind ?? (event.kind === "skill" ? "skill" : "tool"),
    status: display.status ?? "done",
    logs: display.logs ?? (event.detail ? [event.detail] : []),
    source: "audit",
  };
}

function ExpandableAction({
  item,
  defaultExpanded,
}: {
  item: Extract<ConversationTimelineItem, { type: "action" }>;
  defaultExpanded: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  return (
    <ClawAgentAction
      item={item}
      expanded={expanded}
      onToggle={() => setExpanded((value) => !value)}
    />
  );
}

/**
 * Reuses Claw debug conversation timeline atoms.
 * No composer / session chat box — private session audit view only.
 */
export function ExecutionTimeline({
  events,
  onOpenDelegatedInvocation,
}: ExecutionTimelineProps) {
  const { state } = useProjectConversation();

  const segments = useMemo(() => {
    return events
      .slice()
      .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
      .map(eventToSegment)
      .filter(Boolean) as TimelineSegment[];
  }, [events]);

  if (segments.length === 0) {
    return <p className="text-[12px] text-[#5a6779]">暂无执行事件</p>;
  }

  const hasDelegation = segments.some((item) => item.type === "delegation");
  const pureTimeline = segments.filter(
    (item): item is ConversationTimelineItem => item.type !== "delegation"
  );

  if (!hasDelegation) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-3 py-4">
        <ClawConversationTimeline items={pureTimeline} />
      </div>
    );
  }

  const actionKeys = segments
    .filter(
      (item): item is Extract<ConversationTimelineItem, { type: "action" }> =>
        item.type === "action"
    )
    .map((item) => item.key);
  const lastActionKey = actionKeys[actionKeys.length - 1];

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white px-3 py-4">
      {segments.map((segment) => {
        if (segment.type === "delegation") {
          const name =
            segment.event.display?.targetActorName ?? segment.event.label;
          const targetId = segment.event.display?.targetActorId;
          const childInvocation = targetId
            ? state.invocations.find(
                (item) =>
                  item.actorId === targetId &&
                  state.delegations.some(
                    (dlg) =>
                      dlg.parentInvocationId === segment.event.invocationId &&
                      dlg.targetActorId === targetId
                  )
              )
            : undefined;

          return (
            <div key={segment.event.id} className="space-y-2">
              <p className="px-1 text-[12px] text-[#5a6779]">
                受控委派（子结果回传主 Agent，用户不进入子 Session）
              </p>
              <ClawSubAgentSummonedEvent
                agentName={`${name} · 查看执行审计`}
                running={segment.event.display?.status === "running"}
                onOpen={
                  childInvocation && onOpenDelegatedInvocation
                    ? () => onOpenDelegatedInvocation(childInvocation.id)
                    : undefined
                }
              />
              {segment.event.display?.logs?.length ? (
                <div className="border-l border-slate-200 pl-4">
                  {segment.event.display.logs.map((log) => (
                    <p
                      key={`${segment.event.id}-${log}`}
                      className="text-sm leading-6 text-slate-600"
                    >
                      {log}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          );
        }

        if (segment.type === "user") {
          return <ClawUserMessage key={segment.key} item={segment} />;
        }
        if (segment.type === "thinking") {
          return <ClawAgentThinking key={segment.key} item={segment} />;
        }
        if (segment.type === "action") {
          return (
            <ExpandableAction
              key={segment.key}
              item={segment}
              defaultExpanded={segment.key === lastActionKey}
            />
          );
        }
        return <ClawAgentOutput key={segment.key} item={segment} />;
      })}
    </div>
  );
}
