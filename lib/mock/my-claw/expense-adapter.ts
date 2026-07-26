import type {
  ConversationTimelineActionStatus,
  ConversationTimelineItem,
} from "@/components/claw-hub-next/detail/utils";
import {
  EXPENSE_ARTIFACTS_AFTER_DELETION,
  EXPENSE_DEMO_STEPS,
  EXPENSE_TODO_ITEMS,
  type ExpenseArtifact,
  type ExpenseClarifyOption,
  type ExpenseClarifySummaryEntry,
  type ExpenseDemoItem,
  type ExpenseDemoStep,
  type ExpensePlanItem,
  type ExpenseSubagentTask,
  type ExpenseTodoItem,
  type ExpenseToolCallItem,
} from "./expense-demo";

export type ExpenseInspectorTaskStatus = "done" | "running" | "pending";

export interface ExpenseInspectorTask {
  id: string;
  title: string;
  detail: string;
  status: ExpenseInspectorTaskStatus;
}

export interface ExpenseInspectorTool {
  id: string;
  name: string;
  headline: string;
  status: string;
  category?: string;
}

export interface ExpenseInspectorModel {
  tasks: ExpenseInspectorTask[];
  files: ExpenseArtifact[];
  tools: ExpenseInspectorTool[];
  completedTaskCount: number;
}

/** Render nodes consumed by ExpenseNodeView — single conversion path from demo steps. */
export type ExpenseRenderNode =
  | {
      key: string;
      type: "user";
      timeline: Extract<ConversationTimelineItem, { type: "user" }>;
    }
  | {
      key: string;
      type: "thinking";
      timeline: Extract<ConversationTimelineItem, { type: "thinking" }>;
    }
  | {
      key: string;
      type: "output";
      timeline: Extract<ConversationTimelineItem, { type: "output" }>;
    }
  | {
      key: string;
      type: "action";
      timeline: Extract<ConversationTimelineItem, { type: "action" }>;
    }
  | {
      key: string;
      type: "clarify";
      question: string;
      options: ExpenseClarifyOption[];
      freeInputLabel?: string;
      selectedValue: string;
    }
  | {
      key: string;
      type: "clarify_summary";
      entries: Array<ExpenseClarifySummaryEntry & { answerLabel: string }>;
    }
  | {
      key: string;
      type: "plan";
      status: string;
      items: ExpensePlanItem[];
    }
  | {
      key: string;
      type: "todo";
      items: ExpenseTodoItem[];
    }
  | {
      key: string;
      type: "subagent";
      principalAgent: string;
      principalAction: string;
      tasks: ExpenseSubagentTask[];
    }
  | {
      key: string;
      type: "artifacts";
      artifacts: ExpenseArtifact[];
      note?: string;
    }
  | {
      key: string;
      type: "compression";
      title: string;
      summary: string;
    }
  | {
      key: string;
      type: "destructive";
      timeline: Extract<ConversationTimelineItem, { type: "action" }>;
      summary?: string;
      impact: string[];
      paths: string[];
      confirmLabel: string;
      cancelLabel: string;
    };

export interface ExpenseConversationView {
  stepCount: number;
  nodes: ExpenseRenderNode[];
  inspector: ExpenseInspectorModel;
}

function assistantMessage(
  id: string,
  content: string,
  attachments?: string[]
): Extract<ConversationTimelineItem, { type: "output" }>["message"] {
  return {
    id,
    role: "assistant",
    sender: "我的Claw",
    time: "",
    content,
    attachments,
    auditRecords: [],
  };
}

function userMessage(
  id: string,
  content: string,
  attachments?: string[]
): Extract<ConversationTimelineItem, { type: "user" }>["message"] {
  return {
    id,
    role: "user",
    sender: "我",
    time: "",
    content,
    attachments,
    auditRecords: [],
  };
}

function formatUnknown(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.response === "string") return record.response;
    if (typeof record.message === "string") return record.message;
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function toolStatusToTimeline(
  status: string
): ConversationTimelineActionStatus {
  if (status.includes("error") || status.includes("denied") || status.includes("fail")) {
    return "failed";
  }
  if (
    status.includes("running") ||
    status.includes("needs_approval") ||
    status === "destructive" ||
    status.includes("waiting")
  ) {
    return "running";
  }
  return "done";
}

function resolveClarifyAnswer(
  options: ExpenseClarifyOption[],
  fallbackValue: string
): string {
  return options.find((option) => option.value === fallbackValue)?.summary ?? fallbackValue;
}

function buildToolLogs(item: ExpenseToolCallItem): string[] {
  const logs: string[] = [];
  if (item.summary) logs.push(item.summary);
  if (item.successSummary) logs.push(item.successSummary);
  if (item.deniedSummary) logs.push(item.deniedSummary);
  if (item.retryMessage) logs.push(item.retryMessage);
  if (item.stream?.length) logs.push(...item.stream);
  if (item.args && Object.keys(item.args).length > 0) {
    logs.push(`参数：${formatUnknown(item.args)}`);
  }
  const outputText = formatUnknown(item.output);
  if (outputText) logs.push(outputText);
  if (item.impact?.length) logs.push(...item.impact.map((line) => `影响：${line}`));
  if (item.risks?.length) logs.push(...item.risks.map((line) => `风险：${line}`));
  return logs.length > 0 ? logs : [`${item.action ?? "调用"} ${item.target ?? item.toolName}`];
}

function mapItem(step: ExpenseDemoStep, item: ExpenseDemoItem, index: number): ExpenseRenderNode {
  const key = `${step.id}-${item.id}-${index}`;

  switch (item.kind) {
    case "user_message":
      return {
        key,
        type: "user",
        timeline: {
          key,
          type: "user",
          message: userMessage(item.id, item.text, item.attachments),
        },
      };
    case "thinking":
      return {
        key,
        type: "thinking",
        timeline: {
          key,
          type: "thinking",
          active: false,
          message: assistantMessage(item.id, item.content),
        },
      };
    case "narration":
      return {
        key,
        type: "output",
        timeline: {
          key,
          type: "output",
          message: assistantMessage(item.id, item.text),
        },
      };
    case "clarify": {
      const preferredByKey: Record<string, string> = {
        submit_mode: "draft_first",
        expense_scope: "travel_basic",
        project_code: "default_travel_project",
      };
      const preferred = preferredByKey[item.questionKey];
      const selectedValue = item.options.some((option) => option.value === preferred)
        ? preferred!
        : item.options[0]?.value ?? "";
      return {
        key,
        type: "clarify",
        question: item.question,
        options: item.options,
        freeInputLabel: item.freeInputLabel,
        selectedValue,
      };
    }
    case "clarify_summary":
      return {
        key,
        type: "clarify_summary",
        entries: item.entries.map((entry) => ({
          ...entry,
          answerLabel: resolveClarifyAnswer(entry.options, entry.fallbackValue),
        })),
      };
    case "skill_chip":
      return {
        key,
        type: "action",
        timeline: {
          key,
          type: "action",
          title: `技能 · ${item.skill}`,
          kind: "skill",
          status: "done",
          logs: [
            item.description ?? "",
            item.response ?? "",
            item.request ? `请求：${formatUnknown(item.request)}` : "",
          ].filter(Boolean),
          source: "audit",
        },
      };
    case "plan_card":
      return {
        key,
        type: "plan",
        status: item.status,
        items: item.items,
      };
    case "todo_list":
      return {
        key,
        type: "todo",
        items: item.items,
      };
    case "tool_call": {
      const title =
        item.headline ||
        [item.action, item.target].filter(Boolean).join(" · ") ||
        item.toolName;
      const logs = buildToolLogs(item);
      const timeline: Extract<ConversationTimelineItem, { type: "action" }> = {
        key,
        type: "action",
        title,
        kind: "tool",
        status: toolStatusToTimeline(item.status),
        logs,
        time: item.elapsed,
        source: "audit",
      };

      if (item.status === "destructive" || item.status === "needs_approval") {
        return {
          key,
          type: "destructive",
          timeline: {
            ...timeline,
            // Completed demo playback: HITL gates are already resolved.
            status: "done",
          },
          summary: item.summary ?? item.successSummary,
          impact: item.impact ?? [],
          paths: item.paths ?? [],
          confirmLabel:
            item.confirmLabel ??
            (item.status === "needs_approval" ? "允许并继续" : "确认执行"),
          cancelLabel: item.cancelLabel ?? "拒绝",
        };
      }

      return {
        key,
        type: "action",
        timeline: {
          ...timeline,
          // Static completed session: collapse transient running states.
          status:
            item.status === "running" || item.status === "running_to_success"
              ? "done"
              : timeline.status,
        },
      };
    }
    case "subagent_group":
      return {
        key,
        type: "subagent",
        principalAgent: item.principalAgent,
        principalAction: item.principalAction,
        tasks: item.tasks,
      };
    case "artifact_list":
      return {
        key,
        type: "artifacts",
        artifacts: item.artifacts,
        note: item.note,
      };
    case "context_compression":
      return {
        key,
        type: "compression",
        title: item.completedTitle ?? item.title ?? "上下文压缩",
        summary: item.completedSummary ?? item.summary ?? "",
      };
    default: {
      const _exhaustive: never = item;
      return {
        key,
        type: "output",
        timeline: {
          key,
          type: "output",
          message: assistantMessage(
            key,
            `未识别的步骤类型：${String((_exhaustive as ExpenseDemoItem).kind)}`
          ),
        },
      };
    }
  }
}

function buildInspector(): ExpenseInspectorModel {
  const tools: ExpenseInspectorTool[] = [];
  const seenTools = new Set<string>();

  for (const step of EXPENSE_DEMO_STEPS) {
    for (const item of step.items) {
      if (item.kind !== "tool_call") continue;
      if (seenTools.has(item.id)) continue;
      seenTools.add(item.id);
      tools.push({
        id: item.id,
        name: item.toolName,
        headline: item.headline ?? item.toolName,
        status: item.status,
        category: item.category,
      });
    }
  }

  const tasks: ExpenseInspectorTask[] = EXPENSE_TODO_ITEMS.map((item, index) => ({
    id: `todo-${index + 1}`,
    title: item.title,
    detail: item.detail,
    status: "done" as const,
  }));

  return {
    tasks,
    files: EXPENSE_ARTIFACTS_AFTER_DELETION,
    tools,
    completedTaskCount: tasks.length,
  };
}

/** Map the full expense demo script into render nodes + inspector model. */
export function buildExpenseConversationView(
  steps: ExpenseDemoStep[] = EXPENSE_DEMO_STEPS
): ExpenseConversationView {
  const nodes = steps.flatMap((step) =>
    step.items.map((item, index) => mapItem(step, item, index))
  );

  return {
    stepCount: steps.length,
    nodes,
    inspector: buildInspector(),
  };
}

export interface ExpenseClarifyQuestion {
  id: string;
  questionKey: string;
  question: string;
  options: ExpenseClarifyOption[];
  freeInputLabel?: string;
}

/** Ordered clarify questions for the interactive pager (one slot, flip pages). */
export function getExpenseClarifyQuestions(
  steps: ExpenseDemoStep[] = EXPENSE_DEMO_STEPS
): ExpenseClarifyQuestion[] {
  const questions: ExpenseClarifyQuestion[] = [];
  for (const step of steps) {
    for (const item of step.items) {
      if (item.kind !== "clarify") continue;
      questions.push({
        id: item.id,
        questionKey: item.questionKey,
        question: item.question,
        options: item.options,
        freeInputLabel: item.freeInputLabel,
      });
    }
  }
  return questions;
}

/**
 * Split the demo timeline around clarify HITL:
 * - prefix: before first clarify (usually user message)
 * - suffix: from clarify_summary onward (execution after answers)
 */
export function splitExpenseNodesForClarifyFlow(
  steps: ExpenseDemoStep[] = EXPENSE_DEMO_STEPS
): {
  prefix: ExpenseRenderNode[];
  suffix: ExpenseRenderNode[];
  clarifyQuestions: ExpenseClarifyQuestion[];
  stepCount: number;
  inspector: ExpenseInspectorModel;
} {
  const clarifyQuestions = getExpenseClarifyQuestions(steps);
  const prefix: ExpenseRenderNode[] = [];
  const suffix: ExpenseRenderNode[] = [];
  let seenClarify = false;
  let inSuffix = false;

  for (const step of steps) {
    for (const [index, item] of step.items.entries()) {
      if (item.kind === "clarify") {
        seenClarify = true;
        continue;
      }
      if (item.kind === "clarify_summary") {
        inSuffix = true;
        continue;
      }
      const node = mapItem(step, item, index);
      if (!seenClarify && !inSuffix) {
        prefix.push(node);
      } else if (inSuffix) {
        suffix.push(node);
      }
    }
  }

  return {
    prefix,
    suffix,
    clarifyQuestions,
    stepCount: steps.length,
    inspector: buildInspector(),
  };
}

export function buildClarifySummaryEntries(
  answers: Record<string, string | { type: "custom"; text: string }>,
  steps: ExpenseDemoStep[] = EXPENSE_DEMO_STEPS
): Array<ExpenseClarifySummaryEntry & { answerLabel: string }> {
  const summaryItem = steps
    .flatMap((step) => step.items)
    .find((item) => item.kind === "clarify_summary");
  if (!summaryItem || summaryItem.kind !== "clarify_summary") return [];

  return summaryItem.entries.map((entry) => {
    const answer = answers[entry.answerKey];
    let answerLabel = entry.customLabel;
    if (answer && typeof answer === "object" && answer.type === "custom") {
      answerLabel = answer.text || entry.customLabel;
    } else {
      const value = typeof answer === "string" ? answer : entry.fallbackValue;
      answerLabel =
        entry.options.find((option) => option.value === value)?.summary ||
        entry.options.find((option) => option.value === value)?.label ||
        value;
    }
    return { ...entry, answerLabel };
  });
}
