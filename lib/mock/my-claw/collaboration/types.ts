export type WorkspaceKind = "personal" | "organization";

export interface PersonalSpace {
  id: "personal";
  kind: "personal";
  name: string;
  ownerUserId: string;
}

export interface OrganizationWorkspace {
  id: string;
  kind: "organization";
  name: string;
  description: string;
  organizationName: string;
  projectCount: number;
  actorCount: number;
}

export interface CollaborationUser {
  id: string;
  name: string;
  roleLabel: string;
  initials: string;
}

export interface CollaborationProject {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  status: "active" | "archived";
  leadUserId: string;
  memberIds: string[];
  actorIds: string[];
  squadIds: string[];
  contextBrief: string;
  createdAt: string;
  updatedAt: string;
}

export type AgentActorType =
  | "personal_claw"
  | "platform_claw"
  | "multi_agent_group";

export type ActorRuntimeStatus = "online" | "busy" | "offline" | "error";

export interface AgentActor {
  id: string;
  workspaceId: string;
  type: AgentActorType;
  name: string;
  description: string;
  avatar?: string;
  /** Required for personal_claw; must be 1:1 with Human. */
  ownerUserId?: string;
  sourceLabel: string;
  runtimeStatus: ActorRuntimeStatus;
  activeRunCount: number;
  lastActiveAt: string;
}

export type SquadMemberState = "active" | "pending_consent";

export interface SquadAgentMember {
  actorId: string;
  state: SquadMemberState;
  roleLabel: string;
}

/** @deprecated Use SquadAgentMember — kept as alias during migration. */
export type SquadMember = SquadAgentMember;

export interface Squad {
  id: string;
  workspaceId: string;
  projectId: string;
  name: string;
  description: string;
  leaderActorId: string;
  /** Agent-primary membership; Humans are derived from personal_claw. */
  agentMembers: SquadAgentMember[];
  status: "ready" | "running" | "degraded";
  activeIssueCount: number;
  updatedAt: string;
}

export type IssueStatus =
  | "backlog"
  | "todo"
  | "in_progress"
  | "in_review"
  | "done"
  | "blocked"
  | "cancelled";

export type IssuePriority = "urgent" | "high" | "medium" | "low";

export type ExecutorRef =
  | { kind: "human"; id: string }
  | { kind: "agent"; id: string }
  | { kind: "squad"; id: string };

export interface Issue {
  id: string;
  key: string;
  workspaceId: string;
  projectId: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  status: IssueStatus;
  priority: IssuePriority;
  ownerUserId: string;
  executor: ExecutorRef | null;
  reviewerUserId: string | null;
  commentIds: string[];
  runIds: string[];
  artifactIds: string[];
  createdAt: string;
  updatedAt: string;
}

export type RunStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export type RunLogEventType =
  | "agent"
  | "exec_command"
  | "patch_apply"
  | "output";

export interface RunLogEvent {
  id: string;
  index: number;
  type: RunLogEventType;
  content: string;
  timestamp: string;
}

export interface Run {
  id: string;
  workspaceId: string;
  projectId: string;
  issueId: string;
  executor: ExecutorRef;
  status: RunStatus;
  triggerType: "assignment" | "mention" | "rerun";
  startedAt?: string;
  completedAt?: string;
  summary: string;
  errorMessage?: string;
  childRuns?: {
    actorId: string;
    status: RunStatus;
    summary: string;
  }[];
  events?: RunLogEvent[];
  tokenUsage?: {
    input: number;
    output: number;
    cache: number;
    runs: number;
  };
}

export interface IssueComment {
  id: string;
  issueId: string;
  author:
    | { kind: "human"; id: string }
    | { kind: "agent"; id: string }
    | { kind: "system"; id: "system" };
  content: string;
  mentionedActorIds: string[];
  createdAt: string;
  runId?: string;
}

export interface ProjectArtifact {
  id: string;
  projectId: string;
  issueId?: string;
  runId?: string;
  name: string;
  kind: "file" | "report" | "link" | "pull_request";
  createdByLabel: string;
  createdAt: string;
}

export type ProjectWorkSourceType =
  | "github_repository"
  | "local_directory";

export type WorkSourceAvailability =
  | "available"
  | "unavailable"
  | "authorization_required";

export interface ProjectWorkSourceBinding {
  id: string;
  workspaceId: string;
  projectId: string;
  type: ProjectWorkSourceType;
  name: string;
  /** GitHub URL or absolute local path. */
  locator: string;
  branch?: string;
  ref?: string;
  subpath?: string;
  access: "read" | "read_write";
  availability: WorkSourceAvailability;
  validatedAt?: string;
  boundAt: string;
}

/** @deprecated Use ProjectWorkSourceBinding. */
export type ProjectResourceBinding = ProjectWorkSourceBinding;
/** @deprecated Use ProjectWorkSourceType. */
export type ResourceBindingType = ProjectWorkSourceType;

export interface ProjectWorkingFile {
  id: string;
  workspaceId: string;
  projectId: string;
  name: string;
  path: string;
  sizeLabel: string;
  updatedByLabel: string;
  updatedAt: string;
  /** Optional link back to a work source. */
  workSourceId?: string;
}

export type InboxEventType =
  | "issue_assigned"
  | "mentioned"
  | "review_requested"
  | "run_completed"
  | "run_failed"
  | "squad_invitation"
  | "personal_claw_consent"
  | "project_update"
  | "session_delivery";

export interface InboxItem {
  id: string;
  userId: string;
  type: InboxEventType;
  title: string;
  summary: string;
  unread: boolean;
  /** Optional comment to focus when opening an Issue thread. */
  focusCommentId?: string;
  source:
    | { kind: "personal"; label: string }
    | {
        kind: "session";
        sessionId: string;
        sessionTitle: string;
        label: string;
      }
    | {
        kind: "project";
        workspaceId: string;
        workspaceName: string;
        projectId: string;
        projectName: string;
        issueId?: string;
      };
  createdAt: string;
}

export type ActivityKind =
  | "project"
  | "issue"
  | "run"
  | "squad"
  | "context"
  | "comment";

export interface ProjectActivityItem {
  id: string;
  projectId: string;
  workspaceId: string;
  kind: ActivityKind;
  title: string;
  summary: string;
  actorLabel: string;
  createdAt: string;
  issueId?: string;
  squadId?: string;
  runId?: string;
}

export interface WorkspaceCatalogResource {
  id: string;
  workspaceId: string;
  type: ProjectWorkSourceType;
  name: string;
  locator: string;
  branch?: string;
  access: "read" | "read_write";
  availability: WorkSourceAvailability;
}

export const CURRENT_USER_ID = "user-rowan";

export const ACTOR_TYPE_LABELS: Record<AgentActorType, string> = {
  personal_claw: "个人 Claw",
  platform_claw: "平台 Claw",
  multi_agent_group: "多智能体组",
};

export const WORK_SOURCE_TYPE_LABELS: Record<ProjectWorkSourceType, string> = {
  github_repository: "GitHub Repository",
  local_directory: "Local Directory",
};

export const WORK_SOURCE_AVAILABILITY_LABELS: Record<
  WorkSourceAvailability,
  string
> = {
  available: "可用",
  unavailable: "不可用",
  authorization_required: "待授权",
};

export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  backlog: "Backlog",
  todo: "Todo",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
  blocked: "Blocked",
  cancelled: "Cancelled",
};

export const ISSUE_PRIORITY_LABELS: Record<IssuePriority, string> = {
  urgent: "紧急",
  high: "高",
  medium: "中",
  low: "低",
};

export const RUN_STATUS_LABELS: Record<RunStatus, string> = {
  queued: "Queued",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
};

export const SQUAD_STATUS_LABELS: Record<Squad["status"], string> = {
  ready: "Ready",
  running: "Running",
  degraded: "Degraded",
};

export const BOARD_COLUMNS: IssueStatus[] = [
  "backlog",
  "todo",
  "in_progress",
  "in_review",
  "done",
];
