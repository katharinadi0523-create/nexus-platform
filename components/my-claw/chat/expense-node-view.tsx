"use client";

import { CheckCircle2 } from "lucide-react";
import {
  ClawAgentAction,
  ClawAgentOutput,
  ClawAgentThinking,
  ClawSubAgentSummonedEvent,
  ClawUserMessage,
} from "@/components/claw-hub-next/conversation-timeline";
import type { ExpenseRenderNode } from "@/lib/mock/my-claw/expense-adapter";
import { cn } from "@/lib/utils";

export function ExpenseNodeView({
  node,
  expanded,
  onToggle,
}: {
  node: ExpenseRenderNode;
  expanded: boolean;
  onToggle: () => void;
}) {
  if (node.type === "user") {
    return <ClawUserMessage item={node.timeline} />;
  }

  if (node.type === "thinking") {
    return <ClawAgentThinking item={node.timeline} />;
  }

  if (node.type === "output") {
    return <ClawAgentOutput item={node.timeline} />;
  }

  if (node.type === "action") {
    return (
      <ClawAgentAction item={node.timeline} expanded={expanded} onToggle={onToggle} />
    );
  }

  if (node.type === "clarify") {
    return (
      <div className="max-w-2xl space-y-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <p className="text-[15px] leading-6 text-slate-800">{node.question}</p>
        <div className="flex flex-wrap gap-2">
          {node.options.map((option) => {
            const selected = option.value === node.selectedValue;
            return (
              <span
                key={option.value}
                className={cn(
                  "rounded-xl border px-3 py-2 text-sm",
                  selected
                    ? "border-[#2773ff]/40 bg-[#e8f0fb] font-medium text-[#2773ff]"
                    : "border-slate-200 bg-slate-50 text-slate-600"
                )}
              >
                {option.label}
              </span>
            );
          })}
          {node.freeInputLabel ? (
            <span className="rounded-xl border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-500">
              {node.freeInputLabel}
            </span>
          ) : null}
        </div>
      </div>
    );
  }

  if (node.type === "clarify_summary") {
    return (
      <div className="max-w-2xl space-y-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-sm font-medium text-slate-800">已明确需求</p>
        <div className="space-y-2">
          {node.entries.map((entry) => (
            <div key={entry.answerKey} className="text-sm leading-6 text-slate-600">
              <p className="text-slate-500">{entry.question}</p>
              <p className="font-medium text-slate-800">→ {entry.answerLabel}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (node.type === "plan") {
    return (
      <ClawAgentAction
        item={{
          key: node.key,
          type: "action",
          title: `执行计划 · ${node.status}`,
          kind: "tool",
          status: "done",
          logs: node.items.map(
            (item) => `${item.title}（${item.tool} · ${item.eta}）`
          ),
          source: "audit",
        }}
        expanded={expanded}
        onToggle={onToggle}
      />
    );
  }

  if (node.type === "todo") {
    return (
      <ClawAgentAction
        item={{
          key: node.key,
          type: "action",
          title: "任务清单",
          kind: "tool",
          status: "done",
          logs: node.items.map((item) => `${item.title} — ${item.detail}`),
          source: "audit",
        }}
        expanded={expanded}
        onToggle={onToggle}
      >
        <ol className="space-y-2">
          {node.items.map((item) => (
            <li key={item.title} className="flex gap-2 text-sm leading-6 text-slate-600">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
              <span>
                <span className="font-medium text-slate-800">{item.title}</span>
                <span className="text-slate-500"> — {item.detail}</span>
              </span>
            </li>
          ))}
        </ol>
      </ClawAgentAction>
    );
  }

  if (node.type === "subagent") {
    return (
      <div className="space-y-3">
        <p className="px-1 text-sm leading-6 text-slate-600">{node.principalAction}</p>
        <ClawSubAgentSummonedEvent agentName={node.principalAgent} />
        <div className="space-y-2 pl-1">
          {node.tasks.map((task) => (
            <div
              key={task.title}
              className="flex items-start gap-2 text-sm leading-6 text-slate-600"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
              <div>
                <p className="font-medium text-slate-800">
                  {task.title}
                  {task.elapsed ? (
                    <span className="ml-2 text-xs font-normal text-slate-400">
                      {task.elapsed}
                    </span>
                  ) : null}
                </p>
                <p className="text-slate-500">{task.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (node.type === "artifacts") {
    return (
      <ClawAgentOutput
        item={{
          key: node.key,
          type: "output",
          message: {
            id: node.key,
            role: "assistant",
            sender: "我的Claw",
            time: "",
            content: node.note ?? "会话文件已就绪",
            attachments: node.artifacts.map((artifact) => artifact.name),
            auditRecords: [],
          },
        }}
      />
    );
  }

  if (node.type === "compression") {
    return (
      <ClawAgentThinking
        item={{
          key: node.key,
          type: "thinking",
          active: false,
          message: {
            id: node.key,
            role: "assistant",
            sender: "我的Claw",
            time: "",
            content: `${node.title}\n${node.summary}`,
            auditRecords: [],
          },
        }}
      />
    );
  }

  if (node.type === "destructive") {
    return (
      <ClawAgentAction item={node.timeline} expanded={expanded} onToggle={onToggle}>
        <div className="space-y-3">
          {node.summary ? (
            <p className="text-sm leading-6 text-slate-600">{node.summary}</p>
          ) : null}
          {node.impact.length > 0 ? (
            <ul className="space-y-1.5">
              {node.impact.map((line) => (
                <li key={line} className="text-sm leading-6 text-slate-600">
                  · {line}
                </li>
              ))}
            </ul>
          ) : null}
          {node.paths.length > 0 ? (
            <div className="space-y-1">
              {node.paths.map((path) => (
                <p key={path} className="truncate font-mono text-xs text-slate-400">
                  {path}
                </p>
              ))}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <span className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white">
              {node.confirmLabel}
            </span>
            <span className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
              {node.cancelLabel}
            </span>
          </div>
        </div>
      </ClawAgentAction>
    );
  }

  return null;
}
