"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  Circle,
  FileCheck2,
  FileText,
  Loader2,
  Paperclip,
  Plug,
  SendHorizontal,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import {
  ClawAgentAction,
  ClawAgentOutput,
  ClawAgentThinking,
  ClawConversationTimeline,
} from "@/components/claw-hub-next/conversation-timeline";
import type {
  ConversationTimelineActionKind,
  ConversationTimelineItem,
} from "@/components/claw-hub-next/detail/utils";
import { buildConversationTimeline } from "@/components/claw-hub-next/detail/utils";
import {
  detectSkillSlashCommand,
  filterConfiguredSkills,
  SkillSlashPicker,
  type ConfiguredSkillOption,
} from "@/components/claw-hub-next/skill-slash-picker";
import { useWorkbenchEntity } from "@/components/claw-hub-next/workbench-entity-context";
import { Textarea } from "@/components/ui/textarea";
import type {
  ChatSessionItem,
  ClawDetailData,
  ConversationRunItem,
} from "@/lib/mock/claw-hub-next";
import { cn } from "@/lib/utils";

type InteractiveStepKind = Exclude<ConversationTimelineActionKind, never>;
type InteractiveStepStatus = "waiting" | "running" | "done";

type InteractiveFlowStep = {
  key: string;
  title: string;
  todoTitle: string;
  kind: InteractiveStepKind;
  logs: string[];
  promptText?: string;
  confirmLabel?: string;
};

type InteractiveFlowSequenceItem =
  | {
      key: string;
      type: "thinking";
      text: string;
      phase: "planning" | "progress";
      activeStepIndex?: number;
    }
  | {
      key: string;
      type: "step";
      stepIndex: number;
    }
  | {
      key: string;
      type: "output";
      text: string;
      attachments?: string[];
    };

type InteractiveFlowArtifact = {
  key: string;
  title: string;
  meta: string;
  kind: "file" | "summary";
  revealAtEventIndex: number;
};

type InteractiveFlowContextItem = {
  key: string;
  title: string;
  kind: "skill" | "tool" | "user" | "workspace" | "channel" | "claw";
  revealAtEventIndex: number;
};

type InteractiveFlowTemplate = {
  defaultQuery: string;
  defaultAttachments: string[];
  planningText: string;
  planningDelayMs: number;
  stepDelays: number[];
  finishDelayMs: number;
  recentTaskTitle: string;
  emptyArtifactsText: string;
  emptyContextText: string;
  steps: InteractiveFlowStep[];
  sequence: InteractiveFlowSequenceItem[];
  artifacts: InteractiveFlowArtifact[];
  contextItems: InteractiveFlowContextItem[];
  historyItems: ConversationTimelineItem[];
};

type RuntimeStage = "history" | "planning" | "running" | "paused" | "complete";
const DEBUG_INSPECTOR_AUTO_MIN_WIDTH = 900;
const DEBUG_INSPECTOR_FORCE_MIN_WIDTH = 760;
const INSPECTOR_DEFAULT_WIDTH = 320;
const INSPECTOR_MIN_WIDTH = 280;
const INSPECTOR_MAX_WIDTH = 520;
const INSPECTOR_HANDLE_WIDTH = 6;
const MAIN_SESSION_MIN_WIDTH = 280;

type RuntimeState = {
  stage: RuntimeStage;
  sentQuery: string;
  sentAttachments: string[];
  selectedSkill: string;
  visibleEventCount: number;
};

function trimTrailingPunctuation(value: string) {
  return value.replace(/[。！？.!?]+$/g, "").trim();
}

function shortenText(value: string, maxLength = 18) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length <= maxLength ? normalized : `${normalized.slice(0, maxLength)}...`;
}

function deriveSummaryTitle(text: string) {
  const firstLine = text
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  return shortenText(firstLine ?? "执行结果摘要");
}

function getInteractiveStepKind(title: string, kind: ConversationTimelineActionKind): InteractiveStepKind {
  if (/hitl|人工确认/i.test(title)) {
    return "user";
  }

  return kind;
}

function buildInteractiveFlowTemplate({
  detail,
  session,
  run,
  entityLabel = "Claw",
}: {
  detail: ClawDetailData;
  session?: ChatSessionItem;
  run?: ConversationRunItem;
  entityLabel?: string;
}): InteractiveFlowTemplate {
  const historyItems = buildConversationTimeline(session, run);
  const userItems = historyItems.filter(
    (item): item is Extract<ConversationTimelineItem, { type: "user" }> => item.type === "user"
  );
  const outputItems = historyItems.filter(
    (item): item is Extract<ConversationTimelineItem, { type: "output" }> => item.type === "output"
  );

  const defaultQuery =
    userItems[0]?.message.content ?? session?.preview ?? `请开始处理与 ${detail.overview.scene} 相关的事项。`;
  const defaultAttachments = userItems[0]?.message.attachments ?? [];
  const confirmLabel = trimTrailingPunctuation(userItems[1]?.message.content ?? "确认继续执行");
  const planningText =
    historyItems.find(
      (item): item is Extract<ConversationTimelineItem, { type: "thinking" }> => item.type === "thinking"
    )?.message.content ?? `已收到，我正在为 ${detail.overview.name} 规划当前任务。`;

  const steps: InteractiveFlowStep[] = [];
  const sequence: InteractiveFlowSequenceItem[] = [];
  const artifacts: InteractiveFlowArtifact[] = [];
  const contextItems: InteractiveFlowContextItem[] = [
    {
      key: `${session?.id ?? detail.overview.id}-context-claw`,
      title: `${entityLabel} · ${detail.overview.name}`,
      kind: "claw",
      revealAtEventIndex: 0,
    },
    {
      key: `${session?.id ?? detail.overview.id}-context-channel`,
      title: `渠道 · ${session?.source ?? detail.overview.scene}`,
      kind: "channel",
      revealAtEventIndex: 0,
    },
  ];

  let planningInserted = false;
  let eventIndexCursor = 0;
  let latestUserStepIndex: number | null = null;

  historyItems.forEach((item) => {
    if (item.type === "user") {
      return;
    }

    if (item.type === "thinking") {
      if (!planningInserted) {
        sequence.push({
          key: item.key,
          type: "thinking",
          text: item.message.content,
          phase: "planning",
        });
        planningInserted = true;
      } else {
        sequence.push({
          key: item.key,
          type: "thinking",
          text: item.message.content,
          phase: "progress",
          activeStepIndex: steps.length,
        });
      }
      latestUserStepIndex = null;
      eventIndexCursor += 1;
      return;
    }

    if (item.type === "action") {
      const stepKind = getInteractiveStepKind(item.title, item.kind);
      const nextStep: InteractiveFlowStep = {
        key: item.key,
        title: item.title,
        todoTitle: item.title,
        kind: stepKind,
        logs: item.logs,
        confirmLabel: stepKind === "user" ? confirmLabel : undefined,
      };

      steps.push(nextStep);
      sequence.push({
        key: item.key,
        type: "step",
        stepIndex: steps.length - 1,
      });
      contextItems.push({
        key: `${item.key}-context`,
        title: item.title,
        kind: stepKind,
        revealAtEventIndex: eventIndexCursor,
      });
      latestUserStepIndex = stepKind === "user" ? steps.length - 1 : null;
      eventIndexCursor += 1;
      return;
    }

    if (latestUserStepIndex !== null && !steps[latestUserStepIndex]?.promptText) {
      steps[latestUserStepIndex] = {
        ...steps[latestUserStepIndex],
        promptText: item.message.content,
      };
      latestUserStepIndex = null;
      return;
    }

    sequence.push({
      key: item.key,
      type: "output",
      text: item.message.content,
      attachments: item.message.attachments,
    });

    if (item.message.attachments?.length) {
      item.message.attachments.forEach((attachment, attachmentIndex) => {
        artifacts.push({
          key: `${item.key}-artifact-${attachmentIndex}`,
          title: attachment,
          meta: "生成文件",
          kind: "file",
          revealAtEventIndex: eventIndexCursor,
        });
      });
    }

    eventIndexCursor += 1;
  });

  if (!planningInserted) {
    sequence.unshift({
      key: `${session?.id ?? detail.overview.id}-planning`,
      type: "thinking",
      text: planningText,
      phase: "planning",
    });
    contextItems.forEach((item) => {
      item.revealAtEventIndex += 1;
    });
    artifacts.forEach((item) => {
      item.revealAtEventIndex += 1;
    });
    eventIndexCursor += 1;
  }

  if (steps.length === 0) {
    const fallbackLogs =
      run?.turns.flatMap((turn) => turn.auditRecords.map((record) => record.outputSummary || record.inputSummary)) ?? [];
    const fallbackStep: InteractiveFlowStep = {
      key: `${session?.id ?? detail.overview.id}-fallback-step`,
      title: "任务处理",
      todoTitle: "任务处理",
      kind: "tool",
      logs: fallbackLogs.filter(Boolean),
    };
    steps.push(fallbackStep);
    sequence.push({
      key: fallbackStep.key,
      type: "step",
      stepIndex: 0,
    });
    contextItems.push({
      key: `${fallbackStep.key}-context`,
      title: fallbackStep.title,
      kind: "tool",
      revealAtEventIndex: Math.max(sequence.length - 1, 0),
    });
  }

  if (artifacts.length === 0) {
    const lastOutput = outputItems[outputItems.length - 1];
    if (lastOutput) {
      artifacts.push({
        key: `${lastOutput.key}-summary`,
        title: deriveSummaryTitle(lastOutput.message.content),
        meta: "结果摘要",
        kind: "summary",
        revealAtEventIndex: Math.max(sequence.length - 1, 0),
      });
    } else {
      artifacts.push({
        key: `${session?.id ?? detail.overview.id}-result-summary`,
        title: "执行结果摘要",
        meta: "结果摘要",
        kind: "summary",
        revealAtEventIndex: Math.max(sequence.length - 1, 0),
      });
    }
  }

  return {
    defaultQuery,
    defaultAttachments,
    planningText,
    planningDelayMs: 1400,
    stepDelays: steps.map((step, index) => (step.kind === "user" ? 320 : 760 + Math.min(index, 3) * 120)),
    finishDelayMs: 520,
    recentTaskTitle: run?.title ?? session?.title ?? detail.overview.name,
    emptyArtifactsText: "执行过程中生成的文件与结果摘要会展示在这里。",
    emptyContextText: "任务执行后，会展示当前会话调用的技能与工具。",
    steps,
    sequence,
    artifacts,
    contextItems,
    historyItems,
  };
}

function ProgressStatusIcon({ status }: { status: InteractiveStepStatus }) {
  if (status === "done") {
    return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
  }

  if (status === "running") {
    return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
  }

  return <Circle className="h-4 w-4 text-blue-200" />;
}

function stepStatusText(status: InteractiveStepStatus) {
  return {
    waiting: "未开始",
    running: "进行中",
    done: "已完成",
  }[status];
}

function ArtifactCard({ artifact }: { artifact: InteractiveFlowArtifact }) {
  const Icon = artifact.kind === "file" ? FileText : FileCheck2;

  return (
    <article className="flex items-center gap-2.5 rounded-lg px-1 py-1.5">
      <div className="flex h-5 w-5 shrink-0 items-center justify-center text-blue-500">
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[13px] text-slate-700">{artifact.title}</p>
        <p className="mt-0.5 text-[11px] text-slate-400">{artifact.meta}</p>
      </div>
    </article>
  );
}

function ContextCard({ item }: { item: InteractiveFlowContextItem }) {
  const Icon =
    item.kind === "skill"
      ? Wrench
      : item.kind === "tool"
        ? Plug
        : item.kind === "channel"
          ? Briefcase
          : item.kind === "user"
            ? Sparkles
            : FileText;

  return (
    <article className="flex items-start gap-2.5 rounded-lg px-1 py-1.5">
      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-blue-50 text-blue-600">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <p className="truncate text-[13px] text-slate-700">{item.title}</p>
    </article>
  );
}

function AgentToolLayer({ name, items }: { name: string; items: InteractiveFlowContextItem[] }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-[13px] font-medium text-slate-700">
        <Users className="h-3.5 w-3.5 text-slate-400" />
        <span className="truncate">{name}</span>
      </div>
      <div className="ml-[7px] mt-1.5 space-y-1 border-l border-slate-200 pl-4">
        {items.map((item) => (
          <ContextCard key={item.key} item={item} />
        ))}
      </div>
    </div>
  );
}

function getStepStatus(stepIndex: number, activeStepIndex: number | null, stage: RuntimeStage, stepCount: number): InteractiveStepStatus {
  if (stage === "history" || stage === "complete" || activeStepIndex === stepCount) {
    return "done";
  }

  if (activeStepIndex === null) {
    return "waiting";
  }

  if (stepIndex < activeStepIndex) {
    return "done";
  }

  if (stepIndex === activeStepIndex) {
    return "running";
  }

  return "waiting";
}

export function ClawInteractiveChatPanel({
  detail,
  session,
  run,
  inspectorMode = "auto",
}: {
  detail: ClawDetailData;
  session?: ChatSessionItem;
  run?: ConversationRunItem;
  inspectorMode?: "auto" | "open" | "closed";
}) {
  const { entityLabel } = useWorkbenchEntity();
  const template = useMemo(
    () =>
      buildInteractiveFlowTemplate({
        detail,
        session,
        run,
        entityLabel,
      }),
    [detail, run, session, entityLabel]
  );
  const configuredSkills = useMemo<ConfiguredSkillOption[]>(() => {
    const scopes = ["platform", "tenant", "claw"] as const;

    return scopes.flatMap((scope) =>
      detail.capabilityConfig.skills[scope]
        .filter((item) => item.enabled)
        .map((item) => ({ ...item, scope }))
    );
  }, [detail.capabilityConfig.skills]);
  const skillOptions = useMemo(
    () => Array.from(new Set(configuredSkills.map((item) => item.name))),
    [configuredSkills]
  );
  const initialExpandedSteps = useMemo(
    () =>
      template.steps.reduce<Record<number, boolean>>((accumulator, step, index) => {
        accumulator[index] = step.kind === "user" || index === template.steps.length - 1;
        return accumulator;
      }, {}),
    [template.steps]
  );

  const [draftMessage, setDraftMessage] = useState(template.defaultQuery);
  const [queuedFiles, setQueuedFiles] = useState<string[]>(template.defaultAttachments);
  const [selectedSkill, setSelectedSkill] = useState(skillOptions[0] ?? "");
  const [runtime, setRuntime] = useState<RuntimeState>({
    stage: "history",
    sentQuery: "",
    sentAttachments: [],
    selectedSkill: skillOptions[0] ?? "",
    visibleEventCount: template.sequence.length,
  });
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>(initialExpandedSteps);
  const [panelWidth, setPanelWidth] = useState(0);
  const [inspectorWidth, setInspectorWidth] = useState(INSPECTOR_DEFAULT_WIDTH);
  const [isResizingInspector, setIsResizingInspector] = useState(false);
  const [selectedTaskIndex, setSelectedTaskIndex] = useState<number | null>(null);
  const [skillPicker, setSkillPicker] = useState<{ query: string; startIndex: number } | null>(null);
  const [skillPickerActiveIndex, setSkillPickerActiveIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const filteredPickerSkills = useMemo(
    () => (skillPicker ? filterConfiguredSkills(configuredSkills, skillPicker.query) : []),
    [configuredSkills, skillPicker]
  );
  const activeSkillPickerIndex = filteredPickerSkills.length === 0
    ? 0
    : Math.min(skillPickerActiveIndex, filteredPickerSkills.length - 1);

  useEffect(() => {
    const element = panelRef.current;
    if (!element) {
      return undefined;
    }

    const updateWidth = () => setPanelWidth(element.getBoundingClientRect().width);
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isResizingInspector) {
      return undefined;
    }

    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    function handlePointerMove(event: PointerEvent) {
      const panel = panelRef.current;
      if (!panel) {
        return;
      }

      const rect = panel.getBoundingClientRect();
      const availableWidth = rect.width - MAIN_SESSION_MIN_WIDTH - INSPECTOR_HANDLE_WIDTH;
      const maxWidth = Math.max(INSPECTOR_MIN_WIDTH, Math.min(INSPECTOR_MAX_WIDTH, availableWidth));
      const nextWidth = rect.right - event.clientX;
      setInspectorWidth(Math.min(Math.max(nextWidth, INSPECTOR_MIN_WIDTH), maxWidth));
    }

    function handlePointerUp() {
      setIsResizingInspector(false);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [isResizingInspector]);

  useEffect(() => {
    if (runtime.stage === "history" || runtime.stage === "paused" || runtime.stage === "complete") {
      return undefined;
    }

    if (runtime.stage === "planning") {
      const timer = window.setTimeout(() => {
        setRuntime((current) => (current.stage === "planning" ? { ...current, stage: "running" } : current));
      }, template.planningDelayMs);

      return () => window.clearTimeout(timer);
    }

    if (runtime.visibleEventCount >= template.sequence.length) {
      const timer = window.setTimeout(() => {
        setRuntime((current) => (current.stage === "running" ? { ...current, stage: "complete" } : current));
      }, template.finishDelayMs);

      return () => window.clearTimeout(timer);
    }

    const nextEvent = template.sequence[runtime.visibleEventCount];
    const nextDelay =
      nextEvent?.type === "step"
        ? template.stepDelays[nextEvent.stepIndex] ?? 900
        : nextEvent?.type === "thinking"
          ? 520
          : 420;

    const timer = window.setTimeout(() => {
      setRuntime((current) => {
        if (current.stage !== "running") {
          return current;
        }

        const revealIndex = current.visibleEventCount;
        const revealedEvent = template.sequence[revealIndex];
        const nextStage =
          revealedEvent?.type === "step" && template.steps[revealedEvent.stepIndex]?.kind === "user"
            ? "paused"
            : "running";

        return {
          ...current,
          stage: nextStage,
          visibleEventCount: current.visibleEventCount + 1,
        };
      });
    }, nextDelay);

    return () => window.clearTimeout(timer);
  }, [runtime.stage, runtime.visibleEventCount, template.finishDelayMs, template.planningDelayMs, template.sequence, template.stepDelays, template.steps]);

  const visibleSequenceItems = useMemo(() => {
    if (runtime.stage === "history") {
      return [];
    }

    return template.sequence.slice(0, runtime.visibleEventCount);
  }, [runtime.stage, runtime.visibleEventCount, template.sequence]);

  const activeStepIndex = useMemo(() => {
    if (runtime.stage === "history") {
      return template.steps.length;
    }

    if (runtime.stage === "complete") {
      return template.steps.length;
    }

    const lastVisibleItem = visibleSequenceItems[visibleSequenceItems.length - 1];

    if (!lastVisibleItem) {
      return null;
    }

    if (lastVisibleItem.type === "step") {
      return lastVisibleItem.stepIndex;
    }

    if (lastVisibleItem.type === "thinking" && typeof lastVisibleItem.activeStepIndex === "number") {
      return lastVisibleItem.activeStepIndex;
    }

    const lastVisibleStep = [...visibleSequenceItems]
      .reverse()
      .find((item): item is Extract<InteractiveFlowSequenceItem, { type: "step" }> => item.type === "step");

    return lastVisibleStep?.stepIndex ?? null;
  }, [runtime.stage, template.steps.length, visibleSequenceItems]);

  const visibleArtifacts = useMemo(() => {
    if (runtime.stage === "history") {
      return template.artifacts;
    }

    return template.artifacts.filter((item) => item.revealAtEventIndex < runtime.visibleEventCount);
  }, [runtime.stage, runtime.visibleEventCount, template.artifacts]);

  const visibleContextItems = useMemo(() => {
    const sessionScopedContext: InteractiveFlowContextItem[] = runtime.stage === "history"
      ? []
      : [
          ...(runtime.selectedSkill
            ? [
                {
                  key: `runtime-skill-${runtime.selectedSkill}`,
                  title: `技能 · ${runtime.selectedSkill}`,
                  kind: "skill" as const,
                  revealAtEventIndex: 0,
                },
              ]
            : []),
        ];

    const revealedTemplateContext =
      runtime.stage === "history"
        ? template.contextItems
        : template.contextItems.filter((item) => item.revealAtEventIndex < runtime.visibleEventCount);

    return [...sessionScopedContext, ...revealedTemplateContext].filter(
      (item) => item.kind === "skill" || item.kind === "tool"
    );
  }, [runtime.selectedSkill, runtime.stage, runtime.visibleEventCount, template.contextItems]);

  const isLocked = runtime.stage !== "history" && runtime.stage !== "complete";

  function syncSkillPicker(text: string, cursor: number) {
    if (isLocked) {
      setSkillPicker(null);
      return;
    }

    const slashCommand = detectSkillSlashCommand(text, cursor);
    setSkillPicker(slashCommand);
    setSkillPickerActiveIndex(0);
  }

  function handleSelectSkillFromPicker(skill: ConfiguredSkillOption) {
    const pickerState = skillPicker;
    setSelectedSkill(skill.name);
    setSkillPicker(null);

    if (pickerState) {
      const textarea = textareaRef.current;
      const cursor = textarea?.selectionStart ?? draftMessage.length;
      const nextMessage = `${draftMessage.slice(0, pickerState.startIndex)}${draftMessage.slice(cursor)}`;
      setDraftMessage(nextMessage);

      window.requestAnimationFrame(() => {
        if (!textareaRef.current) {
          return;
        }

        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(pickerState.startIndex, pickerState.startIndex);
      });
    }

    toast.success(`已选择技能 · ${skill.name}`);
  }

  function handleDraftChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const nextValue = event.target.value;
    setDraftMessage(nextValue);
    syncSkillPicker(nextValue, event.target.selectionStart ?? nextValue.length);
  }

  function handleDraftKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!skillPicker || filteredPickerSkills.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSkillPickerActiveIndex((current) =>
        Math.min(current + 1, filteredPickerSkills.length - 1)
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSkillPickerActiveIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      handleSelectSkillFromPicker(filteredPickerSkills[activeSkillPickerIndex]!);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setSkillPicker(null);
    }
  }

  useEffect(() => {
    if (!skillPicker) {
      return undefined;
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (textareaRef.current?.contains(target)) {
        return;
      }

      if (target instanceof Element && target.closest("[data-skill-slash-picker]")) {
        return;
      }

      setSkillPicker(null);
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [skillPicker]);

  function handleAttachFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const fileNames = Array.from(event.target.files ?? []).map((file) => file.name);
    if (!fileNames.length) {
      return;
    }

    setQueuedFiles((current) => [...current, ...fileNames]);
    toast.success(`已加入 ${fileNames.length} 个文件。`);
    event.target.value = "";
  }

  function handleRemoveAttachment(fileName: string) {
    if (isLocked) {
      return;
    }

    setQueuedFiles((current) => current.filter((item) => item !== fileName));
  }

  function handleSend() {
    const nextQuery = draftMessage.trim();

    if (!nextQuery) {
      toast.info("请先输入任务内容。");
      return;
    }

    const startsWithPlanning = template.sequence[0]?.type === "thinking" && template.sequence[0].phase === "planning";

    setExpandedSteps(initialExpandedSteps);
    setRuntime({
      stage: startsWithPlanning ? "planning" : template.steps[0]?.kind === "user" ? "paused" : "running",
      sentQuery: nextQuery,
      sentAttachments: [...queuedFiles],
      selectedSkill,
      visibleEventCount: template.sequence.length > 0 ? 1 : 0,
    });
    setDraftMessage("");
    setQueuedFiles([]);
    setSkillPicker(null);
    setSelectedTaskIndex(null);
  }

  function handleBackToEdit() {
    setDraftMessage(runtime.sentQuery || template.defaultQuery);
    setQueuedFiles(runtime.sentAttachments.length ? runtime.sentAttachments : template.defaultAttachments);
    setSelectedSkill(runtime.selectedSkill || skillOptions[0] || "");
    setRuntime({
      stage: "history",
      sentQuery: "",
      sentAttachments: [],
      selectedSkill: skillOptions[0] ?? "",
      visibleEventCount: template.sequence.length,
    });
    setExpandedSteps(initialExpandedSteps);
    setSkillPicker(null);
    setSelectedTaskIndex(null);
  }

  function handleConfirmStep() {
    setRuntime((current) => ({
      ...current,
      stage: "running",
    }));
  }

  function resizeInspectorBy(delta: number) {
    const currentPanelWidth = panelRef.current?.getBoundingClientRect().width ?? 0;
    const availableWidth = currentPanelWidth - MAIN_SESSION_MIN_WIDTH - INSPECTOR_HANDLE_WIDTH;
    const maxWidth = Math.max(INSPECTOR_MIN_WIDTH, Math.min(INSPECTOR_MAX_WIDTH, availableWidth));
    setInspectorWidth((current) => Math.min(Math.max(current + delta, INSPECTOR_MIN_WIDTH), maxWidth));
  }

  const canForceInspector = panelWidth >= DEBUG_INSPECTOR_FORCE_MIN_WIDTH;
  const showInspector =
    inspectorMode === "open"
      ? canForceInspector
      : inspectorMode === "closed"
        ? false
        : panelWidth >= DEBUG_INSPECTOR_AUTO_MIN_WIDTH;
  const selectedTask = selectedTaskIndex === null ? null : template.steps[selectedTaskIndex];
  const selectedTaskStatus = selectedTaskIndex === null
    ? null
    : getStepStatus(selectedTaskIndex, activeStepIndex, runtime.stage, template.steps.length);
  const completedTaskCount = template.steps.filter((_, index) =>
    getStepStatus(index, activeStepIndex, runtime.stage, template.steps.length) === "done"
  ).length;

  return (
    <div
      ref={panelRef}
      className="grid h-full min-h-0"
      style={{
        gridTemplateColumns: showInspector
          ? `minmax(0, 1fr) ${INSPECTOR_HANDLE_WIDTH}px ${inspectorWidth}px`
          : "minmax(0, 1fr)",
      }}
    >
      <div className="flex h-full min-h-0 flex-col bg-[linear-gradient(180deg,rgba(251,253,255,0.98),rgba(244,248,255,0.98))]">
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-4xl">
            {runtime.stage === "history" ? (
              template.historyItems.length > 0 ? (
                <div className="space-y-4">
                  <ClawConversationTimeline items={template.historyItems} />
                </div>
              ) : (
                <div className="flex min-h-[240px] items-center justify-center px-6 text-center text-sm leading-6 text-slate-400">
                  输入任务内容，开始新的调试会话
                </div>
              )
            ) : (
              <div className="space-y-6">
                <div className="flex justify-end">
                  <div className="max-w-3xl rounded-[16px] border border-blue-100 bg-white px-4 py-3 shadow-[0_10px_24px_rgba(59,130,246,0.08)]">
                    {runtime.sentAttachments.length > 0 ? (
                      <div className="mb-2.5 flex flex-wrap gap-2">
                        {runtime.sentAttachments.map((attachment) => (
                          <span
                            key={attachment}
                            className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/70 px-3 py-1.5 text-xs text-slate-600"
                          >
                            <Paperclip className="h-3.5 w-3.5" />
                            <span>{attachment}</span>
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <p className="text-[15px] leading-6 text-slate-700">{runtime.sentQuery}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {visibleSequenceItems.map((item) => {
                    if (item.type === "thinking") {
                      return (
                        <ClawAgentThinking
                          key={item.key}
                          item={{
                            key: item.key,
                            type: "thinking",
                            active: runtime.stage === "planning" ? item.phase === "planning" : activeStepIndex === item.activeStepIndex,
                            message: {
                              id: item.key,
                              role: "assistant",
                              sender: detail.overview.name,
                              time: "",
                              content: item.text,
                              auditRecords: [],
                            },
                          }}
                        />
                      );
                    }

                    if (item.type === "step") {
                      const step = template.steps[item.stepIndex];
                      const status = getStepStatus(item.stepIndex, activeStepIndex, runtime.stage, template.steps.length);

                      return (
                        <ClawAgentAction
                          key={item.key}
                          item={{
                            key: step.key,
                            type: "action",
                            title: step.title,
                            kind: step.kind,
                            status: status === "running" ? "running" : "done",
                            logs: step.logs,
                            source: "audit",
                          }}
                          expanded={Boolean(expandedSteps[item.stepIndex])}
                          onToggle={() =>
                            setExpandedSteps((current) => ({
                              ...current,
                              [item.stepIndex]: !current[item.stepIndex],
                            }))
                          }
                        >
                          {step.kind === "user" ? (
                            <div className="space-y-4">
                              {step.promptText ? (
                                <p className="text-sm leading-6 text-slate-600">{step.promptText}</p>
                              ) : null}
                              {step.logs.length > 0 ? (
                                <div className="space-y-2">
                                  {step.logs.map((log) => (
                                    <p key={`${step.key}-${log}`} className="text-sm leading-6 text-slate-600">
                                      {log}
                                    </p>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm leading-6 text-slate-600">等待你确认后继续执行后续任务。</p>
                              )}
                              {runtime.stage === "paused" && activeStepIndex === item.stepIndex ? (
                                <div className="flex flex-wrap items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={handleBackToEdit}
                                    className="rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                                  >
                                    返回修改
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleConfirmStep}
                                    className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                                  >
                                    {step.confirmLabel || "确认继续执行"}
                                  </button>
                                </div>
                              ) : runtime.stage === "complete" || activeStepIndex !== item.stepIndex ? (
                                <p className="text-sm leading-6 text-slate-600">已确认，继续执行后续任务。</p>
                              ) : null}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {step.logs.map((log) => (
                                <p key={`${step.key}-${log}`} className="text-sm leading-6 text-slate-600">
                                  {log}
                                </p>
                              ))}
                            </div>
                          )}
                        </ClawAgentAction>
                      );
                    }

                    return (
                      <ClawAgentOutput
                        key={item.key}
                        item={{
                          key: item.key,
                          type: "output",
                          message: {
                            id: item.key,
                            role: "assistant",
                            sender: detail.overview.name,
                            time: "",
                            content: item.text,
                            attachments: item.attachments,
                            auditRecords: [],
                          },
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 bg-transparent px-4 py-4 lg:px-8 lg:py-5">
          <div className="mx-auto w-full max-w-4xl">
            <div className="rounded-[16px] border border-blue-100 bg-white px-4 py-3 transition focus-within:border-blue-300">
              {queuedFiles.length > 0 ? (
                <div className="mb-3 flex flex-wrap gap-2">
                  {queuedFiles.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleRemoveAttachment(item)}
                      disabled={isLocked}
                      className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1.5 text-xs text-slate-600 transition hover:bg-blue-50 disabled:cursor-not-allowed"
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                      <span>{item}</span>
                      <span className="text-slate-400">×</span>
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="relative">
                {skillPicker ? (
                  <div
                    data-skill-slash-picker
                    className="absolute bottom-full left-0 right-0 z-20 mb-2"
                  >
                    <SkillSlashPicker
                      skills={configuredSkills}
                      query={skillPicker.query}
                      activeIndex={activeSkillPickerIndex}
                      onActiveIndexChange={setSkillPickerActiveIndex}
                      onSelect={handleSelectSkillFromPicker}
                    />
                  </div>
                ) : null}

                <Textarea
                  ref={textareaRef}
                  value={draftMessage}
                  onChange={handleDraftChange}
                  onKeyDown={handleDraftKeyDown}
                  onClick={(event) =>
                    syncSkillPicker(
                      event.currentTarget.value,
                      event.currentTarget.selectionStart ?? event.currentTarget.value.length
                    )
                  }
                  disabled={isLocked}
                  className="min-h-[56px] resize-none border-0 bg-transparent px-0 py-0 text-[15px] leading-7 text-slate-700 shadow-none placeholder:text-slate-400 focus-visible:ring-0 disabled:cursor-not-allowed disabled:text-slate-500"
                  placeholder="请输入任务，输入 / 可快速选择技能"
                />
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-2.5 sm:flex-nowrap">
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2.5 sm:flex-nowrap">
                  <div className="relative min-w-0 flex-1">
                    <Wrench className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <select
                      value={selectedSkill}
                      onChange={(event) => setSelectedSkill(event.target.value)}
                      disabled={isLocked}
                      className="h-10 w-full appearance-none rounded-xl border border-blue-200 bg-white pl-9 pr-9 text-sm font-medium text-slate-700 outline-none transition hover:border-blue-300 disabled:cursor-not-allowed"
                    >
                      <option value="">技能</option>
                      {skillOptions.map((skill) => (
                        <option key={skill} value={skill}>
                          技能 · {skill}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>

                  <label
                    title="上传附件"
                    className={cn(
                      "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-white text-blue-600 transition hover:border-blue-300",
                      isLocked ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                    )}
                  >
                    <Paperclip className="h-4 w-4" />
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleAttachFiles}
                      disabled={isLocked}
                    />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!draftMessage.trim() || isLocked}
                  aria-label={isLocked ? "执行中" : "发送"}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-200"
                >
                  {runtime.stage === "planning" || runtime.stage === "running" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <SendHorizontal className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showInspector ? (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="调整主会话和侧边栏宽度"
          aria-valuemin={INSPECTOR_MIN_WIDTH}
          aria-valuemax={INSPECTOR_MAX_WIDTH}
          aria-valuenow={Math.round(inspectorWidth)}
          tabIndex={0}
          title="拖拽调整主会话和侧边栏宽度"
          className={cn(
            "group flex cursor-col-resize items-stretch justify-center bg-white transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500/30",
            isResizingInspector && "bg-blue-50"
          )}
          onPointerDown={(event) => {
            event.preventDefault();
            setIsResizingInspector(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              resizeInspectorBy(16);
            }
            if (event.key === "ArrowRight") {
              event.preventDefault();
              resizeInspectorBy(-16);
            }
          }}
        >
          <span
            className={cn(
              "my-0.5 w-px bg-slate-200 transition-colors group-hover:bg-blue-300",
              isResizingInspector && "bg-blue-400"
            )}
          />
        </div>
      ) : null}

      <aside className={cn("min-h-0 bg-white", showInspector ? "block" : "hidden")}>
        {selectedTask && selectedTaskStatus ? (
          <div className="flex h-full min-h-0 flex-col">
            <header className="flex h-12 shrink-0 items-center gap-2 border-b border-slate-200 px-4">
              <button
                type="button"
                onClick={() => setSelectedTaskIndex(null)}
                aria-label="返回任务规划"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">任务详情</span>
              <span className="shrink-0 text-xs text-slate-400">{stepStatusText(selectedTaskStatus)}</span>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <section className="border-b border-slate-200 pb-5">
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5"><ProgressStatusIcon status={selectedTaskStatus} /></span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium leading-6 text-slate-800">{selectedTask.todoTitle}</h3>
                    <p className="mt-1 text-xs text-blue-600">{detail.overview.name}</p>
                  </div>
                </div>
              </section>

              <section className="border-b border-slate-200 py-5">
                <h3 className="mb-3 text-sm font-semibold text-slate-800">任务目标</h3>
                <p className="text-[13px] leading-6 text-slate-600">{selectedTask.title}</p>
              </section>

              <section className="border-b border-slate-200 py-5">
                <h3 className="mb-3 text-sm font-semibold text-slate-800">执行记录</h3>
                {selectedTask.logs.length > 0 ? (
                  <ol className="space-y-2.5">
                    {selectedTask.logs.map((log, index) => (
                      <li key={`${selectedTask.key}-log-${index}`} className="flex gap-2.5 text-xs leading-5 text-slate-500">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                        <span>{log}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-xs text-slate-400">任务开始后展示执行记录</p>
                )}
              </section>

              <section className="border-b border-slate-200 py-5">
                <header className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800">产出物</h3>
                  <span className="text-xs text-slate-400">{visibleArtifacts.length} 个</span>
                </header>
                {visibleArtifacts.length > 0 ? (
                  <div className="space-y-1">{visibleArtifacts.map((artifact) => <ArtifactCard key={artifact.key} artifact={artifact} />)}</div>
                ) : (
                  <p className="text-xs text-slate-400">{template.emptyArtifactsText}</p>
                )}
              </section>

              <section className="pt-5">
                <header className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800">工具</h3>
                  <span className="text-xs text-slate-400">当前会话</span>
                </header>
                {visibleContextItems.length > 0 ? (
                  <AgentToolLayer name={detail.overview.name} items={visibleContextItems} />
                ) : (
                  <p className="text-xs text-slate-400">{template.emptyContextText}</p>
                )}
              </section>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto p-4">
            <section className="border-b border-slate-200 pb-5">
              <header className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">任务规划</h3>
                <span className="text-xs text-slate-400">{completedTaskCount}/{template.steps.length}</span>
              </header>
              {runtime.stage === "planning" ? (
                <div className="mb-2 flex items-center gap-2 px-2 text-xs text-slate-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
                  正在生成任务规划
                </div>
              ) : null}
              <div className="space-y-1">
                {template.steps.map((step, index) => {
                  const status = getStepStatus(index, activeStepIndex, runtime.stage, template.steps.length);

                  return (
                    <button
                      key={step.key}
                      type="button"
                      onClick={() => setSelectedTaskIndex(index)}
                      className="w-full rounded-md px-2 py-2 text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="mt-0.5"><ProgressStatusIcon status={status} /></span>
                        <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                          <p className="truncate text-[13px] text-slate-700">{step.todoTitle}</p>
                          <span className="shrink-0 text-[11px] text-slate-400">{stepStatusText(status)}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="border-b border-slate-200 py-5">
              <header className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">产出物</h3>
                <span className="text-xs text-slate-400">{visibleArtifacts.length} 个</span>
              </header>
              {visibleArtifacts.length > 0 ? (
                <div className="space-y-1">{visibleArtifacts.map((artifact) => <ArtifactCard key={artifact.key} artifact={artifact} />)}</div>
              ) : (
                <p className="text-xs text-slate-400">{template.emptyArtifactsText}</p>
              )}
            </section>

            <section className="pt-5">
              <header className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">工具</h3>
                <span className="text-xs text-slate-400">按智能体分层</span>
              </header>
              {visibleContextItems.length > 0 ? (
                <AgentToolLayer name={detail.overview.name} items={visibleContextItems} />
              ) : (
                <p className="text-xs text-slate-400">{template.emptyContextText}</p>
              )}
            </section>
          </div>
        )}
      </aside>
    </div>
  );
}
