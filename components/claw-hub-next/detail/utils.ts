import type {
  CapabilityScope,
  ChatMessageItem,
  ChatSessionItem,
  ConversationAuditItem,
  ConversationRunItem,
  KnowledgeScope,
  ResourceConfig,
  WorkspaceEntryItem,
  WorkspaceFolderItem,
} from "@/lib/mock/claw-hub-next";

export function cloneResourceConfig(config: ResourceConfig): ResourceConfig {
  return {
    runtime: {
      ...config.runtime,
      advanced: { ...config.runtime.advanced },
    },
    execution: {
      ...config.execution,
      capabilities: { ...config.execution.capabilities },
    },
  };
}

export type ResourceValidation = {
  maxConcurrentTasks: string;
  maxTaskDurationMin: string;
  workspaceDiskGb: string;
  maxConcurrentExecutions: string;
  maxExecutionTimeoutMin: string;
};

export function getResourceValidation(config: ResourceConfig): ResourceValidation {
  return {
    maxConcurrentTasks:
      config.runtime.maxConcurrentTasks < 1 || config.runtime.maxConcurrentTasks > 20
        ? "请输入 1 - 20 之间的并发任务数。"
        : "",
    maxTaskDurationMin: config.runtime.maxTaskDurationMin > 0 ? "" : "单任务最大运行时长必须大于 0 分钟。",
    workspaceDiskGb: config.execution.workspaceDiskGb > 0 ? "" : "工作目录空间必须大于 0 GB。",
    maxConcurrentExecutions: config.execution.maxConcurrentExecutions >= 1 ? "" : "并发执行环境数上限至少为 1。",
    maxExecutionTimeoutMin: config.execution.maxExecutionTimeoutMin > 0 ? "" : "单次执行超时时间必须大于 0 分钟。",
  };
}

export function canDeleteCapability(scope: CapabilityScope | KnowledgeScope) {
  return scope === "claw";
}

export function getWorkspaceTrail(root: WorkspaceFolderItem, path: string[]) {
  const trail: WorkspaceFolderItem[] = [root];
  let current = root;

  for (const folderId of path) {
    const next = current.children.find(
      (item): item is WorkspaceFolderItem => item.kind === "folder" && item.id === folderId
    );
    if (!next) {
      break;
    }

    trail.push(next);
    current = next;
  }

  return trail;
}

export function countWorkspaceItems(entries: WorkspaceEntryItem[]): { files: number; folders: number } {
  return entries.reduce(
    (accumulator, entry) => {
      if (entry.kind === "folder") {
        const childCounts = countWorkspaceItems(entry.children);
        return {
          files: accumulator.files + childCounts.files,
          folders: accumulator.folders + 1 + childCounts.folders,
        };
      }

      return {
        files: accumulator.files + 1,
        folders: accumulator.folders,
      };
    },
    { files: 0, folders: 0 }
  );
}

export type ConversationMessageWithAudit = ChatMessageItem & {
  auditRecords: ConversationAuditItem[];
  traceId?: string;
  turnNumber?: number;
};

export type ConversationSessionSummary = {
  session: ConversationRunItem;
  linkedChatSession?: ChatSessionItem;
  messages: ConversationMessageWithAudit[];
  auditMessageCount: number;
  auditRecordCount: number;
};

export type ConversationTimelineActionStatus = "done" | "running" | "failed";

export type ConversationTimelineActionKind = "skill" | "tool" | "user";

export type ConversationTimelineItem =
  | {
      key: string;
      type: "user";
      message: ConversationMessageWithAudit;
    }
  | {
      key: string;
      type: "thinking";
      message: ConversationMessageWithAudit;
      active: boolean;
    }
  | {
      key: string;
      type: "action";
      title: string;
      kind: ConversationTimelineActionKind;
      status: ConversationTimelineActionStatus;
      logs: string[];
      time?: string;
      source: "message" | "audit";
    }
  | {
      key: string;
      type: "output";
      message: ConversationMessageWithAudit;
    };

export function buildConversationMessagesWithAudit(
  chatSession?: ChatSessionItem,
  run?: ConversationRunItem
): ConversationMessageWithAudit[] {
  if (!chatSession?.messages.length && !run) {
    return [];
  }

  if (!chatSession?.messages.length && run) {
    return run.turns.flatMap((turn) => [
      {
        id: `${turn.id}-user`,
        role: "user" as const,
        sender: run.userIdentity,
        time: turn.occurredAt,
        content: turn.userInput,
        auditRecords: [],
        traceId: turn.traceId,
        turnNumber: turn.turnNumber,
      },
      {
        id: `${turn.id}-assistant`,
        role: "assistant" as const,
        sender: run.title,
        time: turn.occurredAt,
        content: turn.assistantOutput,
        attachments: turn.attachments,
        auditTurnId: turn.id,
        auditRecords: turn.auditRecords,
        traceId: turn.traceId,
        turnNumber: turn.turnNumber,
      },
    ]);
  }

  const turns = run?.turns ?? [];
  const turnMap = new Map(turns.map((turn) => [turn.id, turn]));
  let turnCursor = 0;
  let activeTurnId: string | undefined;

  return (chatSession?.messages ?? []).map((message) => {
    const explicitTurnId = message.auditTurnId && turnMap.has(message.auditTurnId) ? message.auditTurnId : undefined;

    if (explicitTurnId) {
      activeTurnId = explicitTurnId;
    } else if (message.role === "user" && turns[turnCursor]) {
      activeTurnId = turns[turnCursor].id;
      turnCursor += 1;
    }

    const matchedTurn = activeTurnId ? turnMap.get(activeTurnId) : undefined;
    const auditRecords =
      message.role === "assistant" || message.role === "tool" ? matchedTurn?.auditRecords ?? [] : [];

    return {
      ...message,
      auditTurnId: explicitTurnId ?? (auditRecords.length > 0 ? matchedTurn?.id : undefined),
      auditRecords,
      traceId: matchedTurn?.traceId,
      turnNumber: matchedTurn?.turnNumber,
    };
  });
}

export function buildConversationSessionSummaries(
  chatSessions: ChatSessionItem[],
  conversationRuns: ConversationRunItem[]
): ConversationSessionSummary[] {
  const chatSessionMap = new Map(chatSessions.map((session) => [session.id, session]));

  return conversationRuns.map((session) => {
    const linkedChatSession = chatSessionMap.get(session.id);
    const messages = buildConversationMessagesWithAudit(linkedChatSession, session);

    return {
      session,
      linkedChatSession,
      messages,
      auditMessageCount: messages.filter((message) => message.auditRecords.length > 0).length,
      auditRecordCount: session.turns.reduce((total, turn) => total + turn.auditRecords.length, 0),
    };
  });
}

function normalizeConversationActionTitle(value: string) {
  return value.replace(/\s+/g, "").replace(/：/g, ":").toLowerCase();
}

function getConversationMessageDisplayMode(message: ConversationMessageWithAudit) {
  if (message.role === "user") {
    return "user" as const;
  }

  const displayMode = message.displayMode;

  if (displayMode === "thinking" || displayMode === "output" || displayMode === "skill" || displayMode === "tool") {
    return displayMode;
  }

  if (message.role === "tool") {
    return /skill/i.test(message.toolLabel ?? message.content) ? ("skill" as const) : ("tool" as const);
  }

  const normalizedContent = message.content.trim();
  const thinkingStarters = [
    "我先",
    "收到，我先",
    "收到，我会先",
    "可以，我先",
    "可以，我会",
    "我会先",
    "我先思考",
    "好的，我来",
    "我先拉",
    "我先读",
    "我先补齐",
  ];

  return thinkingStarters.some((starter) => normalizedContent.startsWith(starter))
    ? ("thinking" as const)
    : ("output" as const);
}

function getConversationAuditGroupMeta(record: ConversationAuditItem) {
  if (/skill/i.test(record.targetName)) {
    return {
      title: record.targetName,
      kind: "skill" as const,
    };
  }

  const [title] = record.targetName.split(" / ");

  return {
    title: title?.trim() || record.targetName,
    kind: "tool" as const,
  };
}

function getConversationActionStatus(records: ConversationAuditItem[]): ConversationTimelineActionStatus {
  if (records.some((record) => record.status === "失败")) {
    return "failed";
  }

  if (records.some((record) => record.status !== "成功")) {
    return "running";
  }

  return "done";
}

function parseConversationActionLogs(content: string, title: string) {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-•]\s*/, ""));

  if (lines.length <= 1) {
    return lines;
  }

  const normalizedTitle = normalizeConversationActionTitle(title);
  const [, ...restLines] = lines;
  const firstLine = lines[0] ?? "";
  const shouldDropSummaryLine =
    normalizeConversationActionTitle(firstLine).includes(normalizedTitle) ||
    /^已(调用|启动|执行|接入|触发)/.test(firstLine);

  return shouldDropSummaryLine && restLines.length > 0 ? restLines : lines;
}

function formatConversationAuditLog(record: ConversationAuditItem, title: string) {
  const segments = record.targetName.split(" / ").map((segment) => segment.trim());
  const suffix = segments.length > 1 ? segments.slice(1).join(" / ") : "";
  const summary = record.outputSummary || record.inputSummary;

  if (!summary) {
    return record.targetName;
  }

  return suffix && normalizeConversationActionTitle(segments[0] ?? "") === normalizeConversationActionTitle(title)
    ? `${suffix}：${summary}`
    : summary;
}

function buildConversationActionFromMessage(message: ConversationMessageWithAudit): Extract<ConversationTimelineItem, { type: "action" }> {
  const title = message.toolLabel ?? message.sender;
  const displayMode = getConversationMessageDisplayMode(message);

  return {
    key: `action-${message.id}`,
    type: "action",
    title,
    kind: displayMode === "skill" ? "skill" : "tool",
    status: "done",
    logs: parseConversationActionLogs(message.content, title),
    time: message.time,
    source: "message",
  };
}

function buildConversationActionsFromAudit(
  records: ConversationAuditItem[],
  explicitTitles: Set<string>,
  turnId?: string
): Extract<ConversationTimelineItem, { type: "action" }>[] {
  const groupedRecords = new Map<
    string,
    {
      title: string;
      kind: ConversationTimelineActionKind;
      records: ConversationAuditItem[];
    }
  >();

  records.forEach((record) => {
    const meta = getConversationAuditGroupMeta(record);
    const normalizedTitle = normalizeConversationActionTitle(meta.title);

    if (explicitTitles.has(normalizedTitle)) {
      return;
    }

    const existingGroup = groupedRecords.get(normalizedTitle);

    if (existingGroup) {
      existingGroup.records.push(record);
      return;
    }

    groupedRecords.set(normalizedTitle, {
      title: meta.title,
      kind: meta.kind,
      records: [record],
    });
  });

  return Array.from(groupedRecords.values()).map((group, index) => ({
    key: `audit-action-${turnId ?? "standalone"}-${index}`,
    type: "action",
    title: group.title,
    kind: group.kind,
    status: getConversationActionStatus(group.records),
    logs: group.records
      .map((record) => formatConversationAuditLog(record, group.title))
      .filter((log, logIndex, logs) => Boolean(log) && logs.indexOf(log) === logIndex),
    time: undefined,
    source: "audit",
  }));
}

export function buildConversationTimeline(
  chatSession?: ChatSessionItem,
  run?: ConversationRunItem
): ConversationTimelineItem[] {
  const messages = buildConversationMessagesWithAudit(chatSession, run);

  if (!messages.length) {
    return [];
  }

  if (!run?.turns.length) {
    return messages.map((message) => {
      const displayMode = getConversationMessageDisplayMode(message);

      if (displayMode === "user") {
        return {
          key: `user-${message.id}`,
          type: "user",
          message,
        };
      }

      if (displayMode === "thinking") {
        return {
          key: `thinking-${message.id}`,
          type: "thinking",
          message,
          active: false,
        };
      }

      if (displayMode === "skill" || displayMode === "tool") {
        return buildConversationActionFromMessage(message);
      }

      return {
        key: `output-${message.id}`,
        type: "output",
        message,
      };
    });
  }

  const turnByNumber = new Map(run.turns.map((turn) => [turn.turnNumber, turn]));
  const looseItems: ConversationTimelineItem[] = [];
  const turnMessages = new Map<string, ConversationMessageWithAudit[]>();

  messages.forEach((message) => {
    const matchedTurn = (message.turnNumber && turnByNumber.get(message.turnNumber)) ||
      (message.auditTurnId ? run.turns.find((turn) => turn.id === message.auditTurnId) : undefined);

    if (!matchedTurn) {
      const displayMode = getConversationMessageDisplayMode(message);

      if (displayMode === "user") {
        looseItems.push({
          key: `user-${message.id}`,
          type: "user",
          message,
        });
      } else if (displayMode === "thinking") {
        looseItems.push({
          key: `thinking-${message.id}`,
          type: "thinking",
          message,
          active: false,
        });
      } else if (displayMode === "skill" || displayMode === "tool") {
        looseItems.push(buildConversationActionFromMessage(message));
      } else {
        looseItems.push({
          key: `output-${message.id}`,
          type: "output",
          message,
        });
      }

      return;
    }

    const bucket = turnMessages.get(matchedTurn.id) ?? [];
    bucket.push(message);
    turnMessages.set(matchedTurn.id, bucket);
  });

  const turnItems = run.turns.flatMap((turn) => {
    const messagesInTurn = turnMessages.get(turn.id) ?? [];

    if (!messagesInTurn.length && !turn.auditRecords.length) {
      return [];
    }

    const explicitActions = messagesInTurn
      .filter((message) => {
        const displayMode = getConversationMessageDisplayMode(message);
        return displayMode === "skill" || displayMode === "tool";
      })
      .map((message) => buildConversationActionFromMessage(message));
    const explicitActionTitles = new Set(explicitActions.map((item) => normalizeConversationActionTitle(item.title)));
    const auditActions = buildConversationActionsFromAudit(turn.auditRecords, explicitActionTitles, turn.id);
    const explicitActionMap = new Map(explicitActions.map((item) => [item.key.replace(/^action-/, ""), item]));
    let auditInserted = false;

    const renderedItems = messagesInTurn.flatMap((message) => {
      const displayMode = getConversationMessageDisplayMode(message);

      if (displayMode === "user") {
        return [
          {
            key: `user-${message.id}`,
            type: "user" as const,
            message,
          },
        ];
      }

      if (displayMode === "thinking") {
        return [
          {
            key: `thinking-${message.id}`,
            type: "thinking" as const,
            message,
            active: false,
          },
        ];
      }

      if (displayMode === "skill" || displayMode === "tool") {
        const actionItem = explicitActionMap.get(message.id) ?? buildConversationActionFromMessage(message);
        return [actionItem];
      }

      const nextItems: ConversationTimelineItem[] = [];

      if (!auditInserted && auditActions.length > 0) {
        nextItems.push(...auditActions);
        auditInserted = true;
      }

      nextItems.push({
        key: `output-${message.id}`,
        type: "output",
        message,
      });

      return nextItems;
    });

    return auditInserted ? renderedItems : [...renderedItems, ...auditActions];
  });

  return [...looseItems, ...turnItems];
}

export function formatDurationMs(durationMs?: number) {
  if (!durationMs || durationMs <= 0) {
    return "--";
  }

  if (durationMs < 1000) {
    return `${durationMs}ms`;
  }

  return `${(durationMs / 1000).toFixed(durationMs >= 10_000 ? 1 : 2)}s`;
}

export function getAuditTypeClassName(type: string) {
  switch (type) {
    case "接口调用":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "MCP调用":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "CLI执行":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "工作流节点":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

export function getAuditStatusClassName(status: string) {
  switch (status) {
    case "成功":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "失败":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

export function getTaskRunStatusClassName(status: string) {
  switch (status) {
    case "成功":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "失败":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-sky-200 bg-sky-50 text-sky-700";
  }
}

export function getSecurityLevelClassName(level: string) {
  switch (level) {
    case "高":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "中":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

export function getSecurityActionClassName(action: string) {
  switch (action) {
    case "拦截":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "脱敏":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "放行":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

export function getBoundaryLevelClassName(level: string) {
  switch (level) {
    case "L1：直接放行":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "L2：需用户审批":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "L3：禁止":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-slate-300 bg-slate-100 text-slate-700";
  }
}

export function getSecurityRuleLevelClassName(level: string) {
  switch (level) {
    case "严格":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "标准":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
}

export function getGovernanceActionClassName(action: string) {
  switch (action) {
    case "拦截":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "审批":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "放行":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}
