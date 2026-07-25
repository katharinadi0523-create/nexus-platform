"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Circle,
  FileText,
  Loader2,
  Wrench,
} from "lucide-react";
import {
  ClawAgentAction,
  ClawAgentOutput,
  ClawAgentThinking,
  ClawSubAgentSummonedEvent,
  ClawUserMessage,
} from "@/components/claw-hub-next/conversation-timeline";
import { ClawInteractiveChatPanel } from "@/components/claw-hub-next/interactive-chat-panel";
import { useMyClaw } from "@/components/my-claw/provider";
import {
  buildExpenseConversationView,
  type ExpenseRenderNode,
} from "@/lib/mock/my-claw/expense-adapter";
import { getPersonalClawDetail } from "@/lib/mock/my-claw/personal-claw";
import { getMyClawSession } from "@/lib/mock/my-claw/sessions";
import { cn } from "@/lib/utils";
import { ComposerWithAgents } from "./composer-with-agents";

interface ChatWorkspaceProps {
  sessionId?: string | null;
}

function ExpenseNodeView({
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

function ExpenseInspector({
  view,
}: {
  view: ReturnType<typeof buildExpenseConversationView>;
}) {
  return (
    <aside className="hidden min-h-0 w-[320px] shrink-0 border-l border-slate-200 bg-white lg:block">
      <div className="flex h-full min-h-0 flex-col">
        <header className="flex h-12 shrink-0 items-center border-b border-slate-200 px-4">
          <span className="text-sm font-semibold text-slate-800">任务详情</span>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <section className="border-b border-slate-200 pb-5">
          <header className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">任务进程</h3>
            <span className="text-xs text-slate-400">
              {view.inspector.completedTaskCount}/{view.inspector.tasks.length}
            </span>
          </header>
          <div className="space-y-1">
            {view.inspector.tasks.map((task) => (
              <div key={task.id} className="rounded-md px-2 py-2">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] text-slate-700">{task.title}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{task.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-b border-slate-200 py-5">
          <header className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">会话文件</h3>
            <span className="text-xs text-slate-400">
              {view.inspector.files.length} 个
            </span>
          </header>
          {view.inspector.files.length > 0 ? (
            <div className="space-y-1">
              {view.inspector.files.map((file) => (
                <div
                  key={file.path}
                  className="flex items-start gap-2.5 rounded-md px-2 py-2 hover:bg-slate-50"
                >
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] text-slate-700">{file.name}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-400">
                      {file.size} · {file.path}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-2 text-xs text-slate-400">暂无会话文件</p>
          )}
        </section>

        <section className="pt-5">
          <header className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">工具调用</h3>
            <span className="text-xs text-slate-400">
              {view.inspector.tools.length} 次
            </span>
          </header>
          <div className="space-y-1">
            {view.inspector.tools.map((tool) => (
              <div
                key={tool.id}
                className="flex items-start gap-2.5 rounded-md px-2 py-2"
              >
                <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                <div className="min-w-0">
                  <p className="truncate text-[13px] text-slate-700">{tool.headline}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {tool.name}
                    {tool.category ? ` · ${tool.category}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
        </div>
      </div>
    </aside>
  );
}

function ExpenseChatPanel() {
  const detail = useMemo(() => getPersonalClawDetail(), []);
  const view = useMemo(() => buildExpenseConversationView(), []);
  const [draft, setDraft] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const actionKeys = view.nodes
      .filter(
        (node) =>
          node.type === "action" ||
          node.type === "plan" ||
          node.type === "todo" ||
          node.type === "destructive"
      )
      .map((node) => node.key);
    const lastKey = actionKeys[actionKeys.length - 1];
    if (!lastKey) return;
    setExpanded({ [lastKey]: true });
  }, [view.nodes]);

  return (
    <div className="flex h-full min-h-0">
      <div className="flex min-w-0 flex-1 flex-col bg-[linear-gradient(180deg,rgba(251,253,255,0.98),rgba(244,248,255,0.98))]">
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-4xl space-y-4">
            <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
              <Circle className="h-3 w-3" />
              <span>差旅报销演示 · {view.stepCount} 步完整流程</span>
            </div>
            {view.nodes.map((node) => (
              <ExpenseNodeView
                key={node.key}
                node={node}
                expanded={Boolean(expanded[node.key])}
                onToggle={() =>
                  setExpanded((current) => ({
                    ...current,
                    [node.key]: !current[node.key],
                  }))
                }
              />
            ))}
          </div>
        </div>
        <div className="shrink-0 px-4 py-4 lg:px-8 lg:py-5">
          <div className="mx-auto w-full max-w-4xl">
            <ComposerWithAgents
              detail={detail}
              value={draft}
              onChange={setDraft}
              onSend={() => setDraft("")}
            />
          </div>
        </div>
      </div>
      <ExpenseInspector view={view} />
    </div>
  );
}

function ResearchPlaceholder() {
  return (
    <div className="flex h-full items-center justify-center px-6">
      <div className="max-w-md text-center">
        <Loader2 className="mx-auto h-5 w-5 text-slate-400" />
        <h2 className="mt-4 text-lg font-semibold text-slate-900">科研会话</h2>
        <p className="mt-2 text-sm leading-6 text-[#5a6779]">
          科研会话将在 Task 5 接入
        </p>
      </div>
    </div>
  );
}

function BlankChatPanel() {
  const detail = useMemo(() => getPersonalClawDetail(), []);
  const [draft, setDraft] = useState("");

  return (
    <div className="flex h-full min-h-0 flex-col bg-[linear-gradient(180deg,rgba(251,253,255,0.98),rgba(244,248,255,0.98))]">
      <div className="flex min-h-0 flex-1 items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h2 className="text-xl font-semibold text-slate-900">开始新会话</h2>
          <p className="mt-2 text-sm leading-6 text-[#5a6779]">
            在下方输入问题，或从左侧选择「上海出差报销」查看完整差旅演示。
          </p>
        </div>
      </div>
      <div className="shrink-0 px-4 py-4 lg:px-8 lg:py-5">
        <div className="mx-auto w-full max-w-4xl">
          <ComposerWithAgents
            detail={detail}
            value={draft}
            onChange={setDraft}
            onSend={() => setDraft("")}
          />
        </div>
      </div>
    </div>
  );
}

function EnterpriseSessionPanel({ sessionId }: { sessionId: string }) {
  const detail = useMemo(() => getPersonalClawDetail(), []);
  const session = detail.chatSessions.find((item) => item.id === sessionId);

  return (
    <ClawInteractiveChatPanel
      detail={detail}
      session={session ?? detail.chatSessions[0]}
      inspectorMode="open"
    />
  );
}

export function ChatWorkspace({ sessionId }: ChatWorkspaceProps) {
  const { setActiveSession } = useMyClaw();

  useEffect(() => {
    setActiveSession(sessionId ?? null);
  }, [sessionId, setActiveSession]);

  if (!sessionId) {
    return <BlankChatPanel />;
  }

  const session = getMyClawSession(sessionId);

  if (!session) {
    return <BlankChatPanel />;
  }

  if (session.kind === "expense") {
    return <ExpenseChatPanel />;
  }

  if (session.kind === "research_multi_agent") {
    return <ResearchPlaceholder />;
  }

  return <EnterpriseSessionPanel sessionId={sessionId} />;
}
