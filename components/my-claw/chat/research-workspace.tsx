"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  CircleX,
  FileCheck2,
  Loader2,
  Plug,
  Sparkles,
  Users,
} from "lucide-react";
import {
  ClawAgentAction,
  ClawAgentOutput,
  ClawAgentThinking,
  ClawSubAgentSummonedEvent,
  ClawUserMessage,
} from "@/components/claw-hub-next/conversation-timeline";
import { useMyClaw } from "@/components/my-claw/provider";
import { getPersonalClawDetail } from "@/lib/mock/my-claw/personal-claw";
import {
  RESEARCH_AGENTS,
  RESEARCH_CLAW_ID,
  RESEARCH_DEFAULT_QUERY,
  RESEARCH_DEFAULT_STEP,
  RESEARCH_MAX_STEP,
  buildResearchSnapshot,
  getResearchAgentSummonIds,
  getResearchStepCount,
  researchStatusLabel,
  type ResearchMessage,
  type ResearchSnapshot,
  type ResearchTaskStatus,
} from "@/lib/mock/my-claw/research-multi-agent";
import { cn } from "@/lib/utils";
import { ComposerWithAgents } from "./composer-with-agents";

function StatusIcon({ status }: { status: ResearchTaskStatus }) {
  if (status === "done") {
    return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
  }
  if (status === "running") {
    return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
  }
  if (status === "failed") {
    return <CircleX className="h-4 w-4 text-red-500" />;
  }
  return <Circle className="h-4 w-4 text-slate-300" />;
}

function MainMessageView({
  message,
  mainSender,
  onOpenTask,
  onClarify,
}: {
  message: ResearchMessage;
  mainSender: string;
  onOpenTask: (taskId: string) => void;
  onClarify: (value: string) => void;
}) {
  if (message.role === "user") {
    return (
      <ClawUserMessage
        item={{
          key: message.id,
          type: "user",
          message: {
            id: message.id,
            role: "user",
            sender: "我",
            time: "",
            content: message.text ?? "",
            auditRecords: [],
          },
        }}
      />
    );
  }

  if (message.kind === "summon" && message.agentKey && message.taskId) {
    const agent = RESEARCH_AGENTS[message.agentKey];
    return (
      <ClawSubAgentSummonedEvent
        agentName={agent?.name ?? message.agentKey}
        running={message.status === "running"}
        onOpen={() => onOpenTask(message.taskId!)}
      />
    );
  }

  if (message.kind === "clarify") {
    return (
      <div className="max-w-2xl space-y-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <p className="text-[15px] leading-6 text-slate-800">
          {message.question ?? "请确认"}
        </p>
        <div className="flex flex-wrap gap-2">
          {(message.options ?? []).map((option) => {
            const selected = message.selected === option.value;
            return (
              <button
                key={option.value}
                type="button"
                disabled={Boolean(message.selected)}
                onClick={(event) => {
                  event.stopPropagation();
                  onClarify(option.value);
                }}
                className={cn(
                  "rounded-xl border px-3 py-2 text-sm transition",
                  selected
                    ? "border-[#2773ff]/40 bg-[#e8f0fb] font-medium text-[#2773ff]"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-[#2773ff]/30",
                  message.selected && !selected && "opacity-50"
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (message.kind === "thinking") {
    return (
      <ClawAgentThinking
        item={{
          key: message.id,
          type: "thinking",
          active: false,
          message: {
            id: message.id,
            role: "assistant",
            sender: mainSender,
            time: "",
            content: message.text ?? "",
            auditRecords: [],
          },
        }}
      />
    );
  }

  if (message.kind === "skill" || message.kind === "tool") {
    const title =
      message.kind === "skill"
        ? `调用${message.skillName ?? ""}`
        : `调用${message.toolName ?? ""}`;
    return (
      <ClawAgentAction
        item={{
          key: message.id,
          type: "action",
          title,
          kind: message.kind,
          status: "done",
          logs: message.text ? [message.text] : [],
          source: "audit",
        }}
        expanded={false}
        onToggle={() => undefined}
      />
    );
  }

  return (
    <ClawAgentOutput
      item={{
        key: message.id,
        type: "output",
        message: {
          id: message.id,
          role: "assistant",
          sender: mainSender,
          time: "",
          content: message.text ?? "",
          auditRecords: [],
        },
      }}
    />
  );
}

function SubMessageView({
  message,
  agentName,
}: {
  message: ResearchMessage;
  agentName: string;
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="w-full max-w-3xl rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm leading-6 text-slate-700">
          <p className="mb-1 text-[11px] font-medium text-slate-400">主智能体</p>
          {message.text}
        </div>
      </div>
    );
  }

  if (message.kind === "thinking") {
    return (
      <ClawAgentThinking
        item={{
          key: message.id,
          type: "thinking",
          active: false,
          message: {
            id: message.id,
            role: "assistant",
            sender: agentName,
            time: "",
            content: message.text ?? "",
            auditRecords: [],
          },
        }}
      />
    );
  }

  if (message.kind === "skill" || message.kind === "tool") {
    const title =
      message.kind === "skill"
        ? (message.skillName ?? "技能")
        : (message.toolName ?? "工具");
    return (
      <ClawAgentAction
        item={{
          key: message.id,
          type: "action",
          title,
          kind: message.kind,
          status: "done",
          logs: message.text ? [message.text] : [],
          source: "audit",
        }}
        expanded={false}
        onToggle={() => undefined}
      />
    );
  }

  if (message.kind === "knowledge") {
    return (
      <ClawAgentAction
        item={{
          key: message.id,
          type: "action",
          title: message.knowledgeName ?? "知识库",
          kind: "tool",
          status: "done",
          logs: message.text ? [message.text] : [],
          source: "audit",
        }}
        expanded={false}
        onToggle={() => undefined}
      />
    );
  }

  if (message.kind === "artifact") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
        <FileCheck2 className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-medium text-slate-700">{message.text}</span>
      </div>
    );
  }

  return (
    <ClawAgentOutput
      item={{
        key: message.id,
        type: "output",
        message: {
          id: message.id,
          role: "assistant",
          sender: agentName,
          time: "",
          content: message.text ?? "",
          auditRecords: [],
        },
      }}
    />
  );
}

function ResearchInspector({
  snapshot,
  onOpenTask,
}: {
  snapshot: ResearchSnapshot;
  onOpenTask: (taskId: string) => void;
}) {
  const doneCount = snapshot.tasks.filter((task) => task.status === "done").length;
  const toolCount = Object.values(snapshot.toolsByAgent).reduce(
    (sum, items) => sum + (items?.length ?? 0),
    0
  );

  return (
    <aside className="hidden min-h-0 w-[320px] shrink-0 border-l border-slate-200 bg-white lg:block">
      <div className="flex h-full min-h-0 flex-col">
        <header className="flex h-12 shrink-0 items-center border-b border-slate-200 px-4">
          <span className="text-sm font-semibold text-slate-800">任务详情</span>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <section className="border-b border-slate-200 pb-5">
            <header className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">任务规划</h3>
              <span className="text-xs text-slate-400">
                {snapshot.showPlan ? `${doneCount}/${snapshot.tasks.length}` : "—"}
              </span>
            </header>
            {snapshot.showPlan ? (
              <div className="space-y-1">
                {snapshot.tasks.map((task) => {
                  const clickable = task.summoned;
                  const content = (
                    <>
                      <StatusIcon status={task.status} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] text-slate-700">
                          {task.name}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {task.agentName}
                        </p>
                      </div>
                      <span className="shrink-0 text-[11px] text-slate-400">
                        {researchStatusLabel(task.status)}
                      </span>
                    </>
                  );
                  return clickable ? (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => onOpenTask(task.id)}
                      className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left hover:bg-slate-50"
                    >
                      {content}
                    </button>
                  ) : (
                    <div
                      key={task.id}
                      className="flex items-center gap-2.5 rounded-md px-2 py-2 opacity-70"
                    >
                      {content}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="px-2 text-xs text-slate-400">
                任务规划将在确认需求后出现
              </p>
            )}
          </section>

          <section className="border-b border-slate-200 py-5">
            <header className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">产出物</h3>
              <span className="text-xs text-slate-400">
                {snapshot.artifacts.length} 个
              </span>
            </header>
            {snapshot.artifacts.length > 0 ? (
              <div className="space-y-1">
                {snapshot.artifacts.map((artifact) => (
                  <div
                    key={artifact.id}
                    className="flex items-start gap-2.5 rounded-md px-2 py-2"
                  >
                    <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] text-slate-700">
                        {artifact.name}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {artifact.size}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-2 text-xs text-slate-400">暂无产出物</p>
            )}
          </section>

          <section className="pt-5">
            <header className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">工具</h3>
              <span className="text-xs text-slate-400">{toolCount} 次</span>
            </header>
            {snapshot.activeAgents.length > 0 ? (
              <div className="space-y-4">
                {snapshot.activeAgents.map((agentKey) => {
                  const agent = RESEARCH_AGENTS[agentKey];
                  const items = snapshot.toolsByAgent[agentKey] ?? [];
                  return (
                    <div key={agentKey}>
                      <div className="flex items-center gap-2 text-[13px] font-medium text-slate-700">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        {agent?.name ?? agentKey}
                      </div>
                      <div className="ml-[7px] mt-1.5 space-y-1 border-l border-slate-200 pl-4">
                        {items.length > 0 ? (
                          items.map((item) => (
                            <div
                              key={`${agentKey}-${item.type}-${item.name}`}
                              className="flex items-center gap-2 py-1 text-xs text-slate-500"
                            >
                              {item.type === "skill" ? (
                                <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                              ) : (
                                <Plug className="h-3.5 w-3.5 text-blue-500" />
                              )}
                              {item.type === "skill" ? "技能" : "工具"} ·{" "}
                              {item.name}
                            </div>
                          ))
                        ) : (
                          <p className="py-1 text-xs text-slate-400">尚未调用</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="px-2 text-xs text-slate-400">暂无工具调用</p>
            )}
          </section>
        </div>
      </div>
    </aside>
  );
}

function SubAgentPanel({
  snapshot,
  taskId,
  onBack,
}: {
  snapshot: ResearchSnapshot;
  taskId: string;
  onBack: () => void;
}) {
  const task = snapshot.tasks.find((item) => item.id === taskId);
  const messages = snapshot.subSessions[taskId] ?? [];
  const agentName = task?.agentName ?? "子智能体";
  const complete = task?.status === "done";

  return (
    <div className="flex h-full min-h-0 flex-col bg-[linear-gradient(180deg,rgba(251,253,255,0.98),rgba(244,248,255,0.98))]">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4">
        <button
          type="button"
          onClick={onBack}
          aria-label="返回主会话"
          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <Users className="h-4 w-4 text-blue-600" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">
            {task?.name ?? "子任务"}
          </p>
          <p className="truncate text-xs text-slate-400">
            {agentName} · 只读会话
          </p>
        </div>
        <span
          className={cn(
            "rounded px-2 py-0.5 text-xs",
            complete
              ? "bg-blue-50 text-blue-700"
              : "bg-slate-100 text-slate-600"
          )}
        >
          {complete ? "已交付" : "运行中"}
        </span>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-4">
          {messages.map((message) => (
            <SubMessageView
              key={message.id}
              message={message}
              agentName={agentName}
            />
          ))}
        </div>
      </div>
      <div className="shrink-0 border-t border-slate-200 bg-white px-5 py-3 text-center text-xs text-slate-400">
        子智能体会话只读 · 消息由主智能体发送
      </div>
    </div>
  );
}

export function ResearchWorkspace() {
  const detail = useMemo(() => getPersonalClawDetail(), []);
  const mainSender = RESEARCH_AGENTS.main.name;
  const { syncSummonedAgents, setSelectedAgentId } = useMyClaw();

  const initialStep =
    RESEARCH_DEFAULT_STEP >= 0 ? RESEARCH_DEFAULT_STEP : RESEARCH_MAX_STEP;
  const [step, setStep] = useState(initialStep);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [draft, setDraft] = useState(RESEARCH_DEFAULT_QUERY);

  const snapshot = useMemo(() => buildResearchSnapshot(step), [step]);
  const stepCount = getResearchStepCount();

  useEffect(() => {
    syncSummonedAgents([
      RESEARCH_CLAW_ID,
      RESEARCH_AGENTS.main.id,
      ...getResearchAgentSummonIds(snapshot),
    ]);
    setSelectedAgentId(RESEARCH_CLAW_ID);
  }, [snapshot, syncSummonedAgents, setSelectedAgentId]);

  useEffect(() => {
    if (!activeTaskId) return;
    const task = snapshot.tasks.find(
      (item) => item.id === activeTaskId && item.summoned
    );
    if (!task) setActiveTaskId(null);
  }, [activeTaskId, snapshot.tasks]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return;
      }
      if (event.key === "ArrowRight") {
        setStep((current) => Math.min(current + 1, RESEARCH_MAX_STEP));
      }
      if (event.key === "ArrowLeft") {
        setStep((current) => Math.max(current - 1, 0));
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function advance() {
    setStep((current) => Math.min(current + 1, RESEARCH_MAX_STEP));
  }

  function openTask(taskId: string) {
    const task = snapshot.tasks.find(
      (item) => item.id === taskId && item.summoned
    );
    if (!task) return;
    setActiveTaskId(taskId);
  }

  function handleClarify(value: string) {
    if (snapshot.stepId !== "clarify") return;
    const clarify = snapshot.mainMessages.find(
      (item) => item.kind === "clarify"
    );
    if (!clarify || clarify.selected) return;
    void value;
    advance();
  }

  if (activeTaskId) {
    return (
      <div className="flex h-full min-h-0">
        <div className="min-w-0 flex-1">
          <SubAgentPanel
            snapshot={snapshot}
            taskId={activeTaskId}
            onBack={() => setActiveTaskId(null)}
          />
        </div>
        <ResearchInspector snapshot={snapshot} onOpenTask={openTask} />
      </div>
    );
  }

  const idle = step === 0 && snapshot.mainMessages.length === 0;

  return (
    <div className="flex h-full min-h-0">
      <div
        className="flex min-w-0 flex-1 cursor-pointer flex-col bg-[linear-gradient(180deg,rgba(251,253,255,0.98),rgba(244,248,255,0.98))]"
        onClick={() => advance()}
      >
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-4xl space-y-4">
            <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
              <Circle className="h-3 w-3" />
              <span>
                科研多智能体演示 · {snapshot.stepLabel}（{step + 1}/{stepCount}
                ）
              </span>
            </div>

            {idle ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 px-6 py-10 text-center">
                <h2 className="text-lg font-semibold text-slate-900">
                  科研智能体 · 多智能体协作
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#5a6779]">
                  已接管当前会话。点击会话区或按 → 推进演示；← 可回退。
                </p>
                <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-700">
                  {RESEARCH_DEFAULT_QUERY}
                </p>
              </div>
            ) : (
              snapshot.mainMessages.map((message) => (
                <MainMessageView
                  key={message.id}
                  message={message}
                  mainSender={mainSender}
                  onOpenTask={openTask}
                  onClarify={handleClarify}
                />
              ))
            )}

            <p className="pt-2 text-center text-xs text-slate-400">
              ← 上一步 · 点击页面或按 → 进入下一步
            </p>
          </div>
        </div>

        <div
          className="shrink-0 px-4 py-4 lg:px-8 lg:py-5"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mx-auto w-full max-w-4xl">
            <ComposerWithAgents
              detail={detail}
              value={draft}
              onChange={setDraft}
              onSend={() => {
                setDraft("");
                advance();
              }}
            />
          </div>
        </div>
      </div>
      <ResearchInspector snapshot={snapshot} onOpenTask={openTask} />
    </div>
  );
}
