export type ProjectMessageKind =
  | "human"
  | "agent_reply"
  | "file_share"
  | "system";

export type AgentInvocationStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export type AgentReplyReviewStatus =
  | "unreviewed"
  | "accepted"
  | "changes_requested";

export type AgentRuntimeStatus =
  | "online"
  | "busy"
  | "offline"
  | "degraded";

export type AgentActorType =
  | "personal_claw"
  | "platform_claw"
  | "multi_agent_group";

export type ProjectWorkSourceType =
  | "github_repository"
  | "local_directory";

export type InboxEventType =
  | "human_mentioned"
  | "agent_reply_ready"
  | "agent_execution_failed"
  | "personal_claw_consent"
  | "project_invitation"
  | "session_degraded";

export type ProjectDrawerKind =
  | "info"
  | "members"
  | "files"
  | "execution"
  | "add_member"
  | null;

export interface AgentReplyReview {
  status: AgentReplyReviewStatus;
  reviewedByUserId?: string;
  reviewedAt?: string;
  feedbackMessageId?: string;
}

export interface CollaborationWorkspace {
  id: string;
  name: string;
  organizationName: string;
  description: string;
}

export interface CollaborationProject {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  status: "active" | "archived";
  ownerUserId: string;
  threadId: string;
  brief: string;
  humanMemberIds: string[];
  agentMemberIds: string[];
  workSourceIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectThread {
  id: string;
  workspaceId: string;
  projectId: string;
  messageIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMessage {
  id: string;
  workspaceId: string;
  projectId: string;
  threadId: string;
  kind: ProjectMessageKind;
  author:
    | { kind: "human"; id: string }
    | { kind: "agent"; id: string }
    | { kind: "system"; id: "system" };
  content: string;
  replyToMessageId?: string;
  mentionedHumanIds: string[];
  mentionedActorIds: string[];
  quotedMessageIds: string[];
  fileIds: string[];
  artifactIds: string[];
  invocationIds: string[];
  agentReview?: AgentReplyReview;
  createdAt: string;
  editedAt?: string;
}

export interface CollaborationUser {
  id: string;
  name: string;
  title: string;
  initials: string;
  /** Workspaces this human belongs to — add-member list is scoped by project.workspaceId */
  workspaceIds: string[];
}

export interface AgentActor {
  id: string;
  workspaceId?: string;
  type: AgentActorType;
  name: string;
  description: string;
  ownerUserId?: string;
  runtimeStatus: AgentRuntimeStatus;
  capabilitySummary: string[];
  lastHeartbeatAt?: string;
}

export type ProjectMember =
  | {
      kind: "human";
      userId: string;
      role: "owner" | "member";
      state: "active" | "invited";
    }
  | {
      kind: "agent";
      actorId: string;
      actorType: AgentActorType;
      state: "active" | "pending_consent" | "offline" | "degraded";
    };

export interface ProjectAgentSession {
  id: string;
  workspaceId: string;
  projectId: string;
  threadId: string;
  actorId: string;
  status: "active" | "paused" | "expired" | "error";
  invocationIds: string[];
  lastSummary: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentInvocationEvent {
  id: string;
  invocationId: string;
  kind:
    | "daemon_trigger"
    | "accepted"
    | "thinking"
    | "query_messages"
    | "read_file"
    | "skill"
    | "tool_call"
    | "sandbox"
    | "delegation"
    | "artifact"
    | "response"
    | "error";
  label: string;
  detail?: string;
  at: string;
  /** Richer display for Claw debug-timeline reuse */
  display?: {
    type: "daemon" | "thinking" | "action" | "output" | "delegation";
    actionKind?: "skill" | "tool" | "user";
    status?: "done" | "running" | "failed";
    logs?: string[];
    content?: string;
    attachments?: string[];
    targetActorId?: string;
    targetActorName?: string;
  };
}

export interface AgentInvocation {
  id: string;
  workspaceId: string;
  projectId: string;
  threadId: string;
  sourceMessageId: string;
  responseMessageId?: string;
  sessionId: string;
  actorId: string;
  status: AgentInvocationStatus;
  inputRefs: string[];
  delegationIds: string[];
  artifactIds: string[];
  eventIds: string[];
  summary: string;
  errorCode?: string;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
  attemptNumber: number;
  /** If set, this is a delegated child run — not shown as inline status on the human message */
  parentInvocationId?: string;
}

export interface AgentDelegation {
  id: string;
  workspaceId: string;
  projectId: string;
  parentInvocationId: string;
  sourceActorId: string;
  targetActorId: string;
  requestSummary: string;
  status:
    | "requested"
    | "accepted"
    | "running"
    | "responded"
    | "failed"
    | "rejected";
  acceptedAt?: string;
  respondedAt?: string;
}

export interface ProjectFileNode {
  id: string;
  workspaceId: string;
  projectId: string;
  nodeType: "folder" | "file";
  parentFolderId?: string;
  name: string;
  mimeType?: string;
  sizeBytes?: number;
  source: "human_upload" | "agent_artifact";
  sourceMessageId?: string;
  invocationId?: string;
  createdBy:
    | { kind: "human"; id: string }
    | { kind: "agent"; id: string };
  visibility: "project";
  createdAt: string;
  updatedAt: string;
}

export interface ProjectArtifact {
  id: string;
  workspaceId: string;
  projectId: string;
  sourceMessageId: string;
  invocationId?: string;
  fileNodeId?: string;
  name: string;
  kind:
    | "file"
    | "report"
    | "link"
    | "commit"
    | "pull_request"
    | "preview";
  url?: string;
  createdBy:
    | { kind: "human"; id: string }
    | { kind: "agent"; id: string };
  visibility: "project";
  createdAt: string;
}

export interface ProjectWorkSource {
  id: string;
  projectId: string;
  type: ProjectWorkSourceType;
  name: string;
  detail: string;
  access: "read" | "read_write";
  availability: "available" | "unavailable" | "authorization_required";
  runtimeActorId?: string;
}

export interface ProjectInboxItem {
  id: string;
  type: InboxEventType;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  workspaceId?: string;
  projectId?: string;
  threadId?: string;
  messageId?: string;
  invocationId?: string;
  actorId?: string;
}

export interface InlineExecutionViewModel {
  invocationId: string;
  actorId: string;
  status: AgentInvocationStatus;
  durationLabel?: string;
  delegationCount: number;
  attemptNumber: number;
  canCancel: boolean;
  canRetry: boolean;
  errorMessage?: string;
}

export interface AgentTriggerEnvelope {
  mode: "request";
  workspaceId: string;
  projectId: string;
  threadId: string;
  messageId: string;
  source: {
    kind: "human" | "agent";
    id: string;
  };
  targetActorId: string;
  text: string;
  quotedMessageIds: string[];
  fileRefs: string[];
  workSourceRefs: string[];
  sessionPolicy: "continue" | "new";
  currentSessionId?: string;
  parentInvocationId?: string;
}
