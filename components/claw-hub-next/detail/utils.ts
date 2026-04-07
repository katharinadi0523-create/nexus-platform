import type {
  CapabilityScope,
  ChatMessageItem,
  ChatSessionItem,
  ConversationAuditItem,
  ConversationRunItem,
  KnowledgeScope,
  ResourceConfig,
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
    const next = current.children.find((item) => item.id === folderId);
    if (!next) {
      break;
    }

    trail.push(next);
    current = next;
  }

  return trail;
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
    case "L1 自动执行":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "L2 通知":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "L3 审批":
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
