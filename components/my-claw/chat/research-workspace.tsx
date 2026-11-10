"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Circle,
  CircleX,
  FileCheck2,
  ListChecks,
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
  RESEARCH_DEMO_STEPS,
  RESEARCH_TASK_DEFS,
  buildResearchSnapshot,
  getResearchAgentSummonIds,
  researchStatusLabel,
  type ResearchMessage,
  type ResearchSnapshot,
  type ResearchTaskStatus,
} from "@/lib/mock/my-claw/research-multi-agent";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ComposerWithAgents } from "./composer-with-agents";
import { PersonalConversationSidePanel, type ConversationPanelTask, type PersonalPanelView } from "@/components/claw-client/personal-conversation-side-panel";
import type { PersonalChatAttachment } from "@/components/claw-client/personal-chat-context";

const WORKSPACE_DEMO_OUTPUTS = [
  ["差旅费用汇总.xlsx", "32 KB"],
  ["报销明细核对表.xlsx", "48 KB"],
  ["票据识别结果.csv", "12 KB"],
  ["差旅政策匹配说明.docx", "96 KB"],
  ["报销申请草稿-v2.pdf", "286 KB"],
  ["异常费用复核记录.md", "8 KB"],
  ["酒店住宿对账单.xlsx", "24 KB"],
  ["交通费用分类结果.csv", "16 KB"],
  ["审批附件目录.docx", "42 KB"],
  ["报销材料完整性检查.pdf", "154 KB"],
  ["成本中心匹配结果.xlsx", "28 KB"],
  ["待补充材料清单.md", "6 KB"],
  ["本次报销处理摘要.docx", "38 KB"],
  ["归档文件索引.csv", "10 KB"],
];

const WORKSPACE_DEMO_UPLOADS = [
  ["差旅申请单-补充页.pdf", "42 KB"],
  ["住宿发票-第二晚.jpg", "326 KB"],
  ["出租车电子发票-返程.pdf", "154 KB"],
  ["会议日程截图.png", "680 KB"],
  ["出差审批记录.docx", "18 KB"],
  ["费用归属说明.md", "16 KB"],
  ["银行卡支付凭证.jpg", "260 KB"],
  ["酒店订单确认单.pdf", "96 KB"],
  ["交通行程补充说明.txt", "9 KB"],
  ["报销人信息确认表.xlsx", "134 KB"],
  ["成本中心编码清单.csv", "88 KB"],
  ["发票查验结果.pdf", "428 KB"],
];

const WORKSPACE_DEMO_INITIAL_UPLOADS = [
  ["上海机票行程单.pdf", "32 KB"],
  ["酒店发票.jpg", "48 KB"],
  ["打车发票-03-18.png", "12 KB"],
];

const WORKSPACE_DEMO_REFERENCES: PersonalChatAttachment[] = [
  { id: "history:workspace:personal-reference-travel-policy", name: "差旅报销标准-2026.pdf", source: "workspace", path: "常用资料 / 差旅报销标准-2026.pdf", sizeLabel: "480 KB" },
  { id: "history:workspace:personal-reference-travel-expense-template", name: "上海差旅费用明细样表.xlsx", source: "workspace", path: "常用资料 / 上海差旅费用明细样表.xlsx", sizeLabel: "72 KB" },
  { id: "history:workspace:personal-reference-hotel-checklist", name: "酒店发票核对清单.md", source: "workspace", path: "常用资料 / 酒店发票核对清单.md", sizeLabel: "9 KB" },
];

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

function CurrentRunProgress({ snapshot }: { snapshot: ResearchSnapshot }) {
  const literatureStatus = snapshot.tasks.find((task) => task.id === "task-literature")?.status ?? "pending";
  const evidenceMatrixReady = snapshot.artifacts.some((artifact) => artifact.id === "art-lit");
  const steps: { title: string; status: ResearchTaskStatus }[] = [
    { title: "明确搜集范围与检索词", status: snapshot.showPlan ? "done" : "running" },
    { title: "跨库检索相关研究与资料", status: literatureStatus },
    { title: "筛选去重并提取关键证据", status: literatureStatus === "done" ? "done" : "pending" },
    { title: "整理带来源的资料清单", status: evidenceMatrixReady ? "done" : "pending" },
  ];
  const completedCount = steps.filter((item) => item.status === "done").length;
  const hasFailure = steps.some((item) => item.status === "failed");
  const complete = completedCount === steps.length;
  const statusLabel = hasFailure ? "部分步骤失败" : complete ? "本轮已完成" : "本轮任务进行中";

  return (
    <div className="flex min-h-8 items-center" onClick={(event) => event.stopPropagation()}>
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className="inline-flex min-h-8 items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
            {hasFailure ? <CircleX className="h-3.5 w-3.5 text-rose-500" /> : complete ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />}
            <span>{statusLabel}</span>
            <span className="text-slate-400">{completedCount}/{steps.length} 项完成</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" side="top" sideOffset={8} className="w-[min(340px,calc(100vw-2rem))] rounded-xl border-slate-200 bg-white p-0 shadow-lg">
          <div className="border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-800">任务清单</h3>
            </div>
          </div>
          <div className="p-2">
            {steps.map((item) => (
              <div key={item.title} className={cn("flex min-h-10 items-center gap-2 rounded-md px-2.5 py-2", item.status === "running" && "bg-blue-50/70")}>
                <StatusIcon status={item.status} />
                <span className={cn("min-w-0 flex-1 text-[13px]", item.status === "pending" ? "text-slate-400" : "text-slate-700")}>{item.title}</span>
                <span className={cn("shrink-0 text-[11px]", item.status === "running" ? "text-blue-600" : item.status === "failed" ? "text-rose-600" : "text-slate-400")}>
                  {{ done: "已完成", running: "进行中", pending: "待开始", failed: "失败" }[item.status]}
                </span>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
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
        openLabel="在右侧工作区查看本轮调用详情"
        onOpen={() => onOpenTask(message.taskId!)}
      />
    );
  }

  if (message.kind === "clarify") {
    return (
      <div className="w-full max-w-[760px] rounded-[14px] border border-[#c9daf8] bg-[#eef4ff] px-[18px] py-4">
        <p className="text-sm font-semibold leading-[1.65] text-[#1e3a6e]">
          {message.question ?? "请确认"}
        </p>
        <div className="mt-3.5 grid gap-2.5">
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
                  "flex min-h-[42px] w-full items-center justify-start rounded-[10px] border px-3.5 text-left text-sm font-medium transition",
                  selected
                    ? "border-[rgba(45,95,255,0.28)] bg-[rgba(45,95,255,0.08)] text-[#1e3a6e]"
                    : "border-[#c9daf8] bg-white text-[#1e3a6e] hover:border-[rgba(45,95,255,0.28)] hover:bg-[rgba(45,95,255,0.04)]",
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

export function ResearchWorkspace({
  highlightedMessageId,
  sessionId = "research-demo",
  personalMode = false,
  workspacePanelOpen = false,
  workspaceView = "summary",
  workspacePanelWidth = 280,
  conversationTitle,
  onWorkspaceViewChange,
  onWorkspacePanelWidthChange,
  onOpenWorkspace,
  onCloseWorkspace,
}: {
  highlightedMessageId?: string | null;
  sessionId?: string;
  personalMode?: boolean;
  workspacePanelOpen?: boolean;
  workspaceView?: PersonalPanelView;
  workspacePanelWidth?: number;
  conversationTitle?: string;
  onWorkspaceViewChange?: (view: PersonalPanelView) => void;
  onWorkspacePanelWidthChange?: (width: number) => void;
  onOpenWorkspace?: () => void;
  onCloseWorkspace?: () => void;
}) {
  const detail = useMemo(() => getPersonalClawDetail(), []);
  const mainSender = RESEARCH_AGENTS.main.name;
  const { syncSummonedAgents, setSelectedAgentId } = useMyClaw();

  const infoGatheringStep = RESEARCH_DEMO_STEPS.findIndex((item) => item.id === "summon-wave-1");
  const initialStep = personalMode && infoGatheringStep >= 0
    ? infoGatheringStep
    : RESEARCH_DEFAULT_STEP >= 0 ? RESEARCH_DEFAULT_STEP : RESEARCH_MAX_STEP;
  const [step, setStep] = useState(initialStep);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [agentDetailRequest, setAgentDetailRequest] = useState<{ taskId: string; requestId: number } | null>(null);
  const agentDetailRequestId = useRef(0);
  const [draft, setDraft] = useState(RESEARCH_DEFAULT_QUERY);

  const snapshot = useMemo(() => buildResearchSnapshot(step), [step]);
  const collaborationAgents: ConversationPanelTask[] = RESEARCH_TASK_DEFS.map((definition) => {
    const agent = RESEARCH_AGENTS[definition.agentKey];
    const currentTask = snapshot.tasks.find((task) => task.id === definition.id);
    const subSession = snapshot.subSessions[definition.id] ?? [];
    const assistantEvents = subSession.filter((message) => message.role === "assistant");
    return {
      id: definition.id,
      title: definition.name,
      agentName: agent.name,
      agentRole: definition.name,
      kind: "subagent",
      status: currentTask?.status ?? "pending",
      prompt: subSession.find((message) => message.role === "user")?.text ?? "本轮尚未调用该智能体。",
      recordContent: `智能体：${agent.name}\n长期职责：${definition.name}\n本轮状态：${currentTask ? researchStatusLabel(currentTask.status) : "待命，尚未参与本轮"}`,
      traceEvents: assistantEvents.map((message, index) => {
        const isLast = index === assistantEvents.length - 1;
        const kind: "thought" | "skill" | "plugin" = message.kind === "skill"
          ? "skill"
          : message.kind === "tool" || message.kind === "knowledge"
            ? "plugin"
            : "thought";
        const title = message.kind === "skill"
          ? message.skillName ?? "技能执行"
          : message.kind === "tool"
            ? message.toolName ?? "工具执行"
            : message.kind === "knowledge"
              ? message.knowledgeName ?? "知识检索"
              : message.kind === "artifact"
                ? "交付产物"
                : message.kind === "thinking"
                  ? "思考记录"
                  : "执行记录";
        const status: ResearchTaskStatus = currentTask?.status === "failed" && isLast
          ? "failed"
          : currentTask?.status === "running" && isLast
            ? "running"
            : "done";
        return { id: message.id, kind, title, content: message.text, status, expandedByDefault: isLast };
      }),
    };
  });
  const summaryOutputs = [
    ...snapshot.artifacts.map((artifact) => ({
      id: artifact.id,
      name: artifact.name,
      path: `对话产出 / ${conversationTitle ?? detail.overview.name} / ${artifact.name}`,
      size: artifact.size,
      source: "本次对话",
      status: artifact.replaces ? "modified" as const : "new" as const,
    })),
    ...WORKSPACE_DEMO_OUTPUTS.map(([name, size], index) => ({
      id: `workspace-demo-output-${index + 1}`,
      name,
      path: `对话产出 / ${conversationTitle ?? "右侧工作区（演示）"} / ${name}`,
      size,
      source: "本次对话",
      status: "new" as const,
      updatedAt: Date.parse("2026-10-27T10:00:00.000Z") - index * 60_000,
    })),
  ];
  const historicalMaterials: PersonalChatAttachment[] = [
    ...WORKSPACE_DEMO_INITIAL_UPLOADS.map(([name, size], index) => ({
      id: `workspace-demo-initial-upload-${index + 1}`,
      name,
      source: "upload" as const,
      sizeLabel: size,
    })),
    ...WORKSPACE_DEMO_UPLOADS.map(([name, size], index) => ({
      id: `workspace-demo-upload-${index + 1}`,
      name,
      source: "upload" as const,
      sizeLabel: size,
    })),
    ...WORKSPACE_DEMO_REFERENCES,
  ];

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
    if (personalMode) {
      agentDetailRequestId.current += 1;
      setAgentDetailRequest({ taskId, requestId: agentDetailRequestId.current });
      onWorkspaceViewChange?.("collaboration");
      onOpenWorkspace?.();
      return;
    }
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
        {personalMode ? (
          <PersonalConversationSidePanel
            open={workspacePanelOpen}
            personalMode
            view={workspaceView}
            panelWidth={workspacePanelWidth}
            onPanelWidthChange={(width) => onWorkspacePanelWidthChange?.(width)}
            onViewChange={(nextView) => onWorkspaceViewChange?.(nextView)}
            onClose={() => onCloseWorkspace?.()}
            outputs={summaryOutputs}
            tasks={[]}
            historicalMaterials={historicalMaterials}
            agents={collaborationAgents}
            agentDetailRequest={agentDetailRequest}
            leadAgentName={mainSender}
            leadAgentStatus={snapshot.tasks.some((task) => task.status === "running") ? "正在协调本轮任务" : "等待下一轮任务"}
            conversationTitle={conversationTitle ?? detail.overview.name}
          />
        ) : <ResearchInspector snapshot={snapshot} onOpenTask={openTask} />}
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
            {idle ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 px-6 py-10 text-center">
                <h2 className="text-lg font-semibold text-slate-900">
                  科研智能体 · 多智能体协作
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-700">
                  {RESEARCH_DEFAULT_QUERY}
                </p>
              </div>
            ) : (
              snapshot.mainMessages.map((message) => (
                <div
                  key={message.id}
                  id={`personal-message-${message.id}`}
                  className={cn(
                    "rounded-xl transition-shadow duration-300",
                    message.id === highlightedMessageId &&
                      "ring-2 ring-[#8fb5f6] ring-offset-4 ring-offset-[#f8f9fb]",
                  )}
                >
                  <MainMessageView
                    message={message}
                    mainSender={mainSender}
                    onOpenTask={openTask}
                    onClarify={handleClarify}
                  />
                </div>
              ))
            )}
          </div>
        </div>

        <div
          className="shrink-0 px-4 py-4 lg:px-8 lg:py-5"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mx-auto w-full max-w-4xl">
            {snapshot.showPlan ? <div className="mb-2"><CurrentRunProgress snapshot={snapshot} /></div> : null}
            <ComposerWithAgents
              detail={detail}
              modelScopeKey={sessionId}
              personalMode={personalMode}
              onOpenWorkspace={onOpenWorkspace}
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
      {personalMode ? (
        <PersonalConversationSidePanel
          open={workspacePanelOpen}
          personalMode
          view={workspaceView}
          panelWidth={workspacePanelWidth}
          onPanelWidthChange={(width) => onWorkspacePanelWidthChange?.(width)}
          onViewChange={(nextView) => onWorkspaceViewChange?.(nextView)}
          onClose={() => onCloseWorkspace?.()}
          outputs={summaryOutputs}
          tasks={[]}
          historicalMaterials={historicalMaterials}
          agents={collaborationAgents}
          agentDetailRequest={agentDetailRequest}
          leadAgentName={mainSender}
          leadAgentStatus={snapshot.tasks.some((task) => task.status === "running") ? "正在协调本轮任务" : "等待下一轮任务"}
          conversationTitle={conversationTitle ?? detail.overview.name}
        />
      ) : <ResearchInspector snapshot={snapshot} onOpenTask={openTask} />}
    </div>
  );
}
