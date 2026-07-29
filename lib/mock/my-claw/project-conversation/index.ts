export * from "./types";
export * from "./workspaces";
export * from "./users";
export * from "./actors";
export * from "./projects";
export {
  SEED_MESSAGES,
  SEED_SESSIONS,
  SEED_INVOCATIONS,
  SEED_DELEGATIONS,
  SEED_EVENTS,
  SEED_FILES,
  SEED_ARTIFACTS,
  SEED_INBOX,
  SEED_TRANSFORMATIONS,
} from "./seed";
export {
  CONV_REQ_DISCUSSION,
  CONV_PROTO_VERIFY,
  CONV_LINEAGE,
  CONV_VENDOR,
  CONV_RESEARCH_QC,
  CONV_RESEARCH_ANALYSIS,
  PROJECT_LUNG_IMMUNO_ID,
  getConversationById,
} from "./projects";

import type {
  AgentInvocation,
  InlineExecutionViewModel,
  ProjectMessage,
} from "./types";

export function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function formatDurationLabel(
  startedAt?: string,
  completedAt?: string
) {
  // Only use fixed endpoints — avoid Date.now() to prevent SSR/client hydration drift.
  if (!startedAt || !completedAt) return undefined;
  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();
  const seconds = Math.max(0, Math.floor((end - start) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rem = seconds % 60;
  return rem === 0 ? `${minutes}m` : `${minutes}m ${rem}s`;
}

export function deriveInlineStatuses(
  message: ProjectMessage,
  invocations: AgentInvocation[]
): InlineExecutionViewModel[] {
  const related = invocations.filter(
    (item) => item.sourceMessageId === message.id && !item.parentInvocationId
  );
  if (related.length === 0) return [];

  const byActor = new Map<string, AgentInvocation[]>();
  for (const inv of related) {
    const list = byActor.get(inv.actorId) ?? [];
    list.push(inv);
    byActor.set(inv.actorId, list);
  }

  const views: InlineExecutionViewModel[] = [];
  for (const [, list] of byActor) {
    const latest = [...list].sort(
      (a, b) => b.attemptNumber - a.attemptNumber
    )[0];
    views.push({
      invocationId: latest.id,
      actorId: latest.actorId,
      status: latest.status,
      durationLabel: formatDurationLabel(latest.startedAt, latest.completedAt),
      delegationCount: latest.delegationIds.length,
      attemptNumber: latest.attemptNumber,
      canCancel: latest.status === "queued" || latest.status === "running",
      canRetry: latest.status === "failed" || latest.status === "cancelled",
      errorMessage: latest.errorMessage,
    });
  }
  return views;
}

export function invocationStatusLabel(status: AgentInvocation["status"]) {
  switch (status) {
    case "queued":
      return "等待运行";
    case "running":
      return "正在执行";
    case "completed":
      return "已回复";
    case "failed":
      return "执行失败";
    case "cancelled":
      return "已取消";
  }
}
