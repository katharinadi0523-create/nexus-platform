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
      detailLines?: string[];
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
      retained?: string[];
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
  timelineItems: ConversationTimelineItem[];
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
        detailLines: logs,
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
        retained: item.retained,
      };
    default: {
      const _exhaustive: never = item;
      return {
        key,
        type: "output",
        timeline: {
          key,
          type: "output",
          message: assistantMessage(key, `未识别的步骤类型：${String((_exhaustive as ExpenseDemoItem).kind)}`),
        },
      };
    }
  }
}

function toTimelineItem(node: ExpenseRenderNode): ConversationTimelineItem | null {
  if (
    node.type === "user" ||
    node.type === "thinking" ||
    node.type === "output" ||
    node.type === "action"
  ) {
    return node.timeline;
  }

  if (node.type === "destructive") {
    return node.timeline;
  }

  if (node.type === "clarify") {
    return {
      key: node.key,
      type: "action",
      title: node.question,
      kind: "user",
      status: "done",
      logs: node.options.map((option) => option.label),
      source: "audit",
    };
  }

  if (node.type === "clarify_summary") {
    return {
      key: node.key,
      type: "output",
      message: assistantMessage(
        node.key,
        node.entries.map((entry) => `${entry.question}\n→ ${entry.answerLabel}`).join("\n\n")
      ),
    };
  }

  if (node.type === "plan") {
    return {
      key: node.key,
      type: "action",
      title: `执行计划 · ${node.status}`,
      kind: "tool",
      status: "done",
      logs: node.items.map((item) => `${item.title}（${item.tool} · ${item.eta}）`),
      source: "audit",
    };
  }

  if (node.type === "todo") {
    return {
      key: node.key,
      type: "action",
      title: "任务清单",
      kind: "tool",
      status: "done",
      logs: node.items.map((item) => `${item.title} — ${item.detail}`),
      source: "audit",
    };
  }

  if (node.type === "subagent") {
    return {
      key: node.key,
      type: "action",
      title: `子智能体 · ${node.principalAgent}`,
      kind: "user",
      status: "done",
      logs: [
        node.principalAction,
        ...node.tasks.map((task) => `${task.title}（${task.status}${task.elapsed ? ` · ${task.elapsed}` : ""}）`),
      ],
      source: "audit",
    };
  }

  if (node.type === "artifacts") {
    return {
      key: node.key,
      type: "output",
      message: assistantMessage(
        node.key,
        node.note ?? "已生成会话文件",
        node.artifacts.map((artifact) => artifact.name)
      ),
    };
  }

  if (node.type === "compression") {
    return {
      key: node.key,
      type: "thinking",
      active: false,
      message: assistantMessage(node.key, `${node.title}\n${node.summary}`),
    };
  }

  return null;
}

function buildInspector(nodes: ExpenseRenderNode[]): ExpenseInspectorModel {
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

  void nodes;
  const files = EXPENSE_ARTIFACTS_AFTER_DELETION;

  const tasks: ExpenseInspectorTask[] = EXPENSE_TODO_ITEMS.map((item, index) => ({
    id: `todo-${index + 1}`,
    title: item.title,
    detail: item.detail,
    status: "done" as const,
  }));

  return {
    tasks,
    files,
    tools,
    completedTaskCount: tasks.length,
  };
}

/** Map the full expense demo script into Nexus timeline nodes + inspector model. */
export function buildExpenseConversationView(
  steps: ExpenseDemoStep[] = EXPENSE_DEMO_STEPS
): ExpenseConversationView {
  const nodes = steps.flatMap((step) =>
    step.items.map((item, index) => mapItem(step, item, index))
  );
  const timelineItems = nodes
    .map((node) => toTimelineItem(node))
    .filter((item): item is ConversationTimelineItem => item !== null);

  return {
    stepCount: steps.length,
    nodes,
    timelineItems,
    inspector: buildInspector(nodes),
  };
}
