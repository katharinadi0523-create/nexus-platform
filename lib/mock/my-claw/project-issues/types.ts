export type ProjectIssueStatus =
  | "clarifying"
  | "in_progress"
  | "waiting_for_human"
  | "in_review"
  | "changes_requested"
  | "blocked"
  | "done"
  | "cancelled"
  | "archived";

export type BoardColumnId =
  | "clarifying"
  | "in_progress"
  | "waiting"
  | "in_review"
  | "done"
  | "failed";

export interface ProjectIssue {
  id: string;
  projectId: string;
  key: string;
  title: string;
  summary: string;
  status: ProjectIssueStatus;
  /**
   * At most one primary Conversation.
   * Empty when created from the board before session collaboration starts.
   */
  conversationId?: string;
  sourceMessageId?: string;
  relatedMessageIds: string[];
  referenceIds: string[];
  humanAssigneeIds: string[];
  agentAssigneeIds: string[];
  invocationIds: string[];
  artifactIds: string[];
  acceptanceCriteria: string[];
  waitingForCurrentUser?: boolean;
  latestProgress?: string;
  /** When true, board places the card in 执行失败 column */
  executionFailed?: boolean;
  createdBy:
    | { kind: "human"; id: string }
    | { kind: "issue_steward"; id: string };
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  archivedAt?: string;
  revision: number;
}

export interface IssueReference {
  id: string;
  projectId: string;
  issueId: string;
  conversationId: string;
  messageId: string;
  createdByUserId: string;
  createdAt: string;
}

export interface IssueMutationProposal {
  id: string;
  projectId: string;
  action:
    | "create"
    | "append"
    | "update"
    | "merge"
    | "complete"
    | "cancel"
    | "archive"
    | "none";
  targetIssueId?: string;
  proposedTitle?: string;
  proposedSummary?: string;
  proposedStatus?: ProjectIssueStatus;
  proposedHumanAssigneeIds?: string[];
  proposedAgentAssigneeIds?: string[];
  evidenceMessageIds: string[];
  confidence: number;
  reason: string;
  requiresConfirmation: boolean;
  createdAt: string;
  dismissed?: boolean;
}

export const PROJECT_ISSUE_STATUS_LABELS: Record<ProjectIssueStatus, string> = {
  clarifying: "待澄清",
  in_progress: "进行中",
  waiting_for_human: "等待 Human",
  in_review: "待验收",
  changes_requested: "进行中",
  blocked: "已阻塞",
  done: "已完成",
  cancelled: "已取消",
  archived: "已归档",
};

export const BOARD_COLUMN_LABELS: Record<BoardColumnId, string> = {
  clarifying: "待澄清或审批确认",
  in_progress: "进行中",
  waiting: "等待反馈",
  in_review: "待验收",
  done: "已完成",
  failed: "执行失败",
};

export const BOARD_COLUMNS: BoardColumnId[] = [
  "clarifying",
  "in_progress",
  "waiting",
  "in_review",
  "done",
  "failed",
];

export function getBoardColumnForIssue(
  issue: ProjectIssue,
  hasFailedInvocation = false
): BoardColumnId | null {
  if (issue.status === "cancelled" || issue.status === "archived") {
    return null;
  }
  if ((hasFailedInvocation || issue.executionFailed) && issue.status !== "done") {
    return "failed";
  }
  switch (issue.status) {
    case "clarifying":
      return "clarifying";
    case "in_progress":
    case "changes_requested":
      return "in_progress";
    case "waiting_for_human":
    case "blocked":
      return "waiting";
    case "in_review":
      return "in_review";
    case "done":
      return "done";
    default:
      return null;
  }
}
