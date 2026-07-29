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
  | "session_degraded"
  | "personal_chat_reply"
  | "project_member_changed"
  | "issue_created"
  | "issue_assigned"
  | "issue_needs_confirmation"
  | "issue_waiting_for_human"
  | "issue_review_ready"
  | "issue_changes_requested"
  | "issue_completed"
  | "project_tool_authorization_required"
  | "project_tool_degraded"
  | "artifact_published";

export type ProjectDrawerKind =
  | "info"
  | "members"
  | "files"
  | "conversation_files"
  | "execution"
  | "add_member"
  | "issue"
  | "shared_tools"
  | "conversation_settings"
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

export type ArtifactScope = "project" | "conversation";

export interface CollaborationProject {
  id: string;
  /** @deprecated use-end must not navigate by workspace; keep for origin/migration */
  workspaceId: string;
  originWorkspaceId?: string;
  name: string;
  description: string;
  status: "active" | "archived";
  ownerUserId: string;
  /**
   * @deprecated Prefer conversationIds. Kept as first/default conversation id
   * for one release of prototype compatibility.
   */
  threadId: string;
  conversationIds: string[];
  brief: string;
  instructions?: string;
  humanMemberIds: string[];
  agentMemberIds: string[];
  workSourceIds: string[];
  sharedToolBindingIds: string[];
  skillBindingIds?: string[];
  issueIds: string[];
  /** Only scope=project file node ids */
  projectFileIds: string[];
  pinned?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Project Conversation (1:N under Project).
 * Messages / sessions / invocations still use `threadId` as this conversation id.
 */
export interface ProjectConversation {
  id: string;
  workspaceId: string;
  projectId: string;
  name: string;
  description?: string;
  humanMemberIds: string[];
  agentBindingIds: string[];
  conversationToolBindingIds: string[];
  messageIds: string[];
  issueIds: string[];
  /** Only scope=conversation file node ids for this conversation */
  conversationFileIds: string[];
  instructions?: string;
  defaultArtifactScope: ArtifactScope;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  pinned?: boolean;
}

/** @deprecated Alias — prefer ProjectConversation */
export type ProjectThread = ProjectConversation;

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
  /** Conversation id (Conversation × Agent session) */
  threadId: string;
  actorId: string;
  status: "active" | "paused" | "expired" | "error";
  invocationIds: string[];
  queuedInvocationIds?: string[];
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
  /** Display path e.g. docs/订单导出 PRD.md */
  path?: string;
  mimeType?: string;
  sizeBytes?: number;
  source: "human_upload" | "agent_artifact";
  sourceMessageId?: string;
  invocationId?: string;
  createdBy:
    | { kind: "human"; id: string }
    | { kind: "agent"; id: string };
  scope: ArtifactScope;
  sourceConversationId?: string;
  sourceArtifactIds?: string[];
  issueIds?: string[];
  producedByTransformationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectArtifact {
  id: string;
  workspaceId: string;
  projectId: string;
  sourceMessageId?: string;
  invocationId?: string;
  fileNodeId?: string;
  name: string;
  kind:
    | "file"
    | "report"
    | "link"
    | "commit"
    | "pull_request"
    | "preview"
    | "data";
  url?: string;
  createdBy:
    | { kind: "human"; id: string }
    | { kind: "agent"; id: string }
    | { kind: "tool"; id: string };
  scope: ArtifactScope;
  sourceConversationId?: string;
  sourceArtifactIds?: string[];
  issueIds?: string[];
  producedByTransformationId?: string;
  createdAt: string;
}

export interface Transformation {
  id: string;
  projectId: string;
  conversationId: string;
  issueIds: string[];
  executorType: "human" | "agent" | "tool";
  executorId: string;
  operationLabel: string;
  inputArtifactIds: string[];
  outputArtifactIds: string[];
  createdAt: string;
  runId?: string;
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
  issueId?: string;
  artifactId?: string;
  projectToolBindingId?: string;
  href?: string;
  sourceType?: "personal_chat" | "project" | "issue" | "agent" | "tool";
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
