"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  PROJECT_CONVERSATION_ACTORS,
  PROJECT_CONVERSATION_PROJECTS,
  PROJECT_CONVERSATION_THREADS,
  PROJECT_CONVERSATION_USERS,
  PROJECT_CONVERSATION_WORKSPACES,
  PROJECT_MEMBERS_BY_PROJECT,
  PROJECT_WORK_SOURCES,
  SEED_ARTIFACTS,
  SEED_DELEGATIONS,
  SEED_EVENTS,
  SEED_FILES,
  SEED_INBOX,
  SEED_INVOCATIONS,
  SEED_MESSAGES,
  SEED_SESSIONS,
  CURRENT_USER_ID,
  createId,
  getActorById,
  getProjectById,
  getUserById,
  getWorkspaceById,
  type AgentActor,
  type AgentDelegation,
  type AgentInvocation,
  type AgentInvocationEvent,
  type CollaborationProject,
  type CollaborationUser,
  type CollaborationWorkspace,
  type ProjectAgentSession,
  type ProjectArtifact,
  type ProjectDrawerKind,
  type ProjectFileNode,
  type ProjectInboxItem,
  type ProjectMember,
  type ProjectMessage,
  type ProjectThread,
  type ProjectWorkSource,
} from "@/lib/mock/my-claw/project-conversation";
import {
  SEED_ISSUE_PROPOSALS,
  SEED_PROJECT_ISSUES,
  type IssueMutationProposal,
  type ProjectIssue,
  type ProjectIssueStatus,
} from "@/lib/mock/my-claw/project-issues";
import {
  PUBLISHED_TOOL_CATALOG,
  SEED_SHARED_TOOL_BINDINGS,
  type ProjectSharedToolBinding,
  type ProjectSharedToolKind,
  type PublishedToolResource,
} from "@/lib/mock/my-claw/project-tools";
import {
  SEED_MY_WORK,
  type MyWorkProjection,
} from "@/lib/mock/my-claw/my-work";

const STORAGE_KEY = "my-claw-project-conversation-v3";

interface ProjectConversationState {
  workspaces: CollaborationWorkspace[];
  projects: CollaborationProject[];
  threads: ProjectThread[];
  messages: ProjectMessage[];
  users: CollaborationUser[];
  actors: AgentActor[];
  membersByProject: Record<string, ProjectMember[]>;
  sessions: ProjectAgentSession[];
  invocations: AgentInvocation[];
  delegations: AgentDelegation[];
  events: AgentInvocationEvent[];
  files: ProjectFileNode[];
  artifacts: ProjectArtifact[];
  workSources: ProjectWorkSource[];
  inbox: ProjectInboxItem[];
  issues: ProjectIssue[];
  issueProposals: IssueMutationProposal[];
  sharedToolBindings: ProjectSharedToolBinding[];
  publishedTools: PublishedToolResource[];
  activeDrawer: ProjectDrawerKind;
  activeInvocationId: string | null;
  activeIssueId: string | null;
  highlightedMessageId: string | null;
  scrollAnchorMessageId: string | null;
  /** Snapshot used by undoIssueProposal */
  lastAppliedProposalSnapshot?: {
    proposalId: string;
    issues: ProjectIssue[];
    projects: CollaborationProject[];
  } | null;
}

interface SendMessagePayload {
  projectId: string;
  content: string;
  mentionedHumanIds: string[];
  mentionedActorIds: string[];
  quotedMessageIds: string[];
  fileIds: string[];
}

interface CreateIssuePayload {
  projectId: string;
  sourceMessageId?: string;
  title: string;
  summary?: string;
  humanAssigneeIds: string[];
  agentAssigneeIds: string[];
  acceptanceCriteria?: string[];
}

type IssueUpdatePatch = Partial<
  Pick<
    ProjectIssue,
    | "title"
    | "summary"
    | "status"
    | "humanAssigneeIds"
    | "agentAssigneeIds"
    | "acceptanceCriteria"
  >
>;

interface BindSharedToolPayload {
  projectId: string;
  publishedResourceVersionId: string;
  permission: "read" | "execute" | "write";
  credentialRef?: string;
  /** When binding from Claw workbench ToolConfigDialog catalog */
  resource?: {
    kind: ProjectSharedToolKind;
    displayName: string;
    description?: string;
    compatibleActorIds?: string[];
    requiresCredential?: boolean;
  };
}

interface ProjectConversationContextValue {
  state: ProjectConversationState;
  currentUserId: string;
  unreadInboxCount: number;
  getWorkspace: (id: string) => CollaborationWorkspace | undefined;
  getProject: (id: string) => CollaborationProject | undefined;
  getThread: (projectId: string) => ProjectThread | undefined;
  getMessages: (projectId: string) => ProjectMessage[];
  getMembers: (projectId: string) => ProjectMember[];
  getUser: (id: string) => CollaborationUser | undefined;
  getActor: (id: string) => AgentActor | undefined;
  getInvocation: (id: string) => AgentInvocation | undefined;
  getSession: (id: string) => ProjectAgentSession | undefined;
  getDelegations: (invocationId: string) => AgentDelegation[];
  getEvents: (invocationId: string) => AgentInvocationEvent[];
  getArtifacts: (ids: string[]) => ProjectArtifact[];
  getFiles: (projectId: string) => ProjectFileNode[];
  getWorkSources: (projectId: string) => ProjectWorkSource[];
  getIssues: (projectId: string) => ProjectIssue[];
  getIssue: (issueId: string) => ProjectIssue | undefined;
  getSharedTools: (projectId: string) => ProjectSharedToolBinding[];
  getMyWorkProjection: () => MyWorkProjection;
  sendMessage: (payload: SendMessagePayload) => { ok: true } | { ok: false; error: string };
  cancelInvocation: (invocationId: string) => void;
  retryInvocation: (
    invocationId: string,
    sessionPolicy: "continue" | "new"
  ) => void;
  acceptAgentReply: (messageId: string) => void;
  requestAgentChanges: (messageId: string, feedback: string) => void;
  openDrawer: (
    kind: Exclude<ProjectDrawerKind, null>,
    invocationId?: string
  ) => void;
  openIssueDrawer: (issueId: string) => void;
  closeDrawer: () => void;
  openExecution: (invocationId: string) => void;
  setHighlightedMessage: (messageId: string | null) => void;
  markInboxRead: (id: string) => void;
  resolvePersonalClawConsent: (
    projectId: string,
    actorId: string,
    decision: "accept" | "reject"
  ) => void;
  addHumanMember: (projectId: string, userId: string) => void;
  addAgentMember: (projectId: string, actorId: string) => void;
  removeMember: (projectId: string, memberRef: string) => void;
  archiveProject: (projectId: string) => void;
  updateProjectBrief: (projectId: string, brief: string) => void;
  restoreActorOnline: (actorId: string) => void;
  addGitHubWorkSource: (
    projectId: string,
    repoInput: string
  ) => { ok: true } | { ok: false; error: string };
  addLocalWorkSource: (
    projectId: string,
    displayName: string,
    localPath: string
  ) => { ok: true } | { ok: false; error: string };
  removeWorkSource: (projectId: string, sourceId: string) => void;
  createIssue: (payload: CreateIssuePayload) => string | null;
  updateIssue: (issueId: string, patch: IssueUpdatePatch) => void;
  acceptIssue: (issueId: string) => void;
  requestIssueChanges: (issueId: string, feedback: string) => void;
  cancelIssue: (issueId: string) => void;
  archiveIssue: (issueId: string) => void;
  bindSharedTool: (payload: BindSharedToolPayload) => void;
  unbindSharedTool: (bindingId: string) => void;
  applyIssueProposal: (proposalId: string) => void;
  dismissIssueProposal: (proposalId: string) => void;
  undoIssueProposal: (proposalId: string) => void;
}

const ProjectConversationContext =
  createContext<ProjectConversationContextValue | null>(null);

function buildInitialState(): ProjectConversationState {
  const threads = PROJECT_CONVERSATION_THREADS.map((thread) => ({
    ...thread,
    messageIds: SEED_MESSAGES.filter((msg) => msg.threadId === thread.id).map(
      (msg) => msg.id
    ),
  }));

  return {
    workspaces: PROJECT_CONVERSATION_WORKSPACES,
    projects: PROJECT_CONVERSATION_PROJECTS,
    threads,
    messages: SEED_MESSAGES,
    users: PROJECT_CONVERSATION_USERS,
    actors: PROJECT_CONVERSATION_ACTORS,
    membersByProject: structuredClone(PROJECT_MEMBERS_BY_PROJECT),
    sessions: SEED_SESSIONS,
    invocations: SEED_INVOCATIONS,
    delegations: SEED_DELEGATIONS,
    events: SEED_EVENTS,
    files: SEED_FILES,
    artifacts: SEED_ARTIFACTS,
    workSources: PROJECT_WORK_SOURCES,
    inbox: SEED_INBOX,
    issues: structuredClone(SEED_PROJECT_ISSUES),
    issueProposals: structuredClone(SEED_ISSUE_PROPOSALS),
    sharedToolBindings: structuredClone(SEED_SHARED_TOOL_BINDINGS),
    publishedTools: structuredClone(PUBLISHED_TOOL_CATALOG),
    activeDrawer: null,
    activeInvocationId: null,
    activeIssueId: null,
    highlightedMessageId: null,
    scrollAnchorMessageId: null,
    lastAppliedProposalSnapshot: null,
  };
}

function mergeMissingById<T extends { id: string }>(
  current: T[] | undefined,
  seed: T[]
): T[] {
  const list = Array.isArray(current) ? [...current] : [];
  const existing = new Set(list.map((item) => item.id));
  for (const item of seed) {
    if (!existing.has(item.id)) {
      list.push(structuredClone(item));
      existing.add(item.id);
    }
  }
  return list;
}

function readPersistedState(): ProjectConversationState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ProjectConversationState>;
    const base = buildInitialState();
    return {
      ...base,
      ...parsed,
      activeDrawer: null,
      activeInvocationId: null,
      activeIssueId: null,
      highlightedMessageId: null,
      scrollAnchorMessageId: null,
      lastAppliedProposalSnapshot: null,
      workspaces: base.workspaces,
      users: base.users,
      actors: base.actors,
      publishedTools: base.publishedTools,
      // Force-merge catalog entities so prototype seeds stay available after hydrate.
      issues: mergeMissingById(parsed.issues, base.issues),
      issueProposals: mergeMissingById(parsed.issueProposals, base.issueProposals),
      sharedToolBindings: mergeMissingById(
        parsed.sharedToolBindings,
        base.sharedToolBindings
      ),
      projects: mergeMissingById(parsed.projects, base.projects).map((project) => {
        const seed = base.projects.find((item) => item.id === project.id);
        if (!seed) return project;
        return {
          ...seed,
          ...project,
          sharedToolBindingIds:
            project.sharedToolBindingIds?.length
              ? project.sharedToolBindingIds
              : seed.sharedToolBindingIds,
          issueIds: project.issueIds?.length ? project.issueIds : seed.issueIds,
        };
      }),
    };
  } catch {
    return null;
  }
}

function nowIso() {
  return new Date().toISOString();
}

export function ProjectConversationProvider({
  children,
}: {
  children: ReactNode;
}) {
  // Always seed identically on server + first client paint to avoid hydration mismatch.
  const [state, setState] = useState<ProjectConversationState>(buildInitialState);
  const [readyToPersist, setReadyToPersist] = useState(false);
  const timersRef = useRef<Record<string, number>>({});
  const scheduleInvocationProgressRef = useRef<
    (invocationId: string, actorId: string, withDelegation: boolean) => void
  >(() => {});

  useEffect(() => {
    // Defer restore so SSR HTML matches the first client paint (seed).
    const timer = window.setTimeout(() => {
      const persisted = readPersistedState();
      if (persisted) {
        setState(persisted);
      }
      setReadyToPersist(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!readyToPersist) return;
    const persistable = {
      workspaces: state.workspaces,
      projects: state.projects,
      threads: state.threads,
      messages: state.messages,
      users: state.users,
      actors: state.actors,
      membersByProject: state.membersByProject,
      sessions: state.sessions,
      invocations: state.invocations,
      delegations: state.delegations,
      events: state.events,
      files: state.files,
      artifacts: state.artifacts,
      workSources: state.workSources,
      inbox: state.inbox,
      issues: state.issues,
      issueProposals: state.issueProposals,
      sharedToolBindings: state.sharedToolBindings,
      publishedTools: state.publishedTools,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
  }, [readyToPersist, state]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      Object.values(timers).forEach((id) => window.clearTimeout(id));
    };
  }, []);
  const unreadInboxCount = useMemo(
    () => state.inbox.filter((item) => !item.read).length,
    [state.inbox]
  );

  const getWorkspace = useCallback(
    (id: string) => state.workspaces.find((item) => item.id === id) ?? getWorkspaceById(id),
    [state.workspaces]
  );
  const getProject = useCallback(
    (id: string) => state.projects.find((item) => item.id === id) ?? getProjectById(id),
    [state.projects]
  );
  const getThread = useCallback(
    (projectId: string) =>
      state.threads.find((item) => item.projectId === projectId),
    [state.threads]
  );
  const getMessages = useCallback(
    (projectId: string) =>
      state.messages
        .filter((item) => item.projectId === projectId)
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        ),
    [state.messages]
  );
  const getMembers = useCallback(
    (projectId: string) => state.membersByProject[projectId] ?? [],
    [state.membersByProject]
  );
  const getUser = useCallback(
    (id: string) => state.users.find((item) => item.id === id) ?? getUserById(id),
    [state.users]
  );
  const getActor = useCallback(
    (id: string) => state.actors.find((item) => item.id === id) ?? getActorById(id),
    [state.actors]
  );
  const getInvocation = useCallback(
    (id: string) => state.invocations.find((item) => item.id === id),
    [state.invocations]
  );
  const getSession = useCallback(
    (id: string) => state.sessions.find((item) => item.id === id),
    [state.sessions]
  );
  const getDelegations = useCallback(
    (invocationId: string) =>
      state.delegations.filter((item) => item.parentInvocationId === invocationId),
    [state.delegations]
  );
  const getEvents = useCallback(
    (invocationId: string) =>
      state.events
        .filter((item) => item.invocationId === invocationId)
        .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()),
    [state.events]
  );
  const getArtifacts = useCallback(
    (ids: string[]) => state.artifacts.filter((item) => ids.includes(item.id)),
    [state.artifacts]
  );
  const getFiles = useCallback(
    (projectId: string) => state.files.filter((item) => item.projectId === projectId),
    [state.files]
  );
  const getWorkSources = useCallback(
    (projectId: string) =>
      state.workSources.filter((item) => item.projectId === projectId),
    [state.workSources]
  );
  const getIssues = useCallback(
    (projectId: string) =>
      state.issues
        .filter((item) => item.projectId === projectId)
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        ),
    [state.issues]
  );
  const getIssue = useCallback(
    (issueId: string) => state.issues.find((item) => item.id === issueId),
    [state.issues]
  );
  const getSharedTools = useCallback(
    (projectId: string) =>
      state.sharedToolBindings.filter((item) => item.projectId === projectId),
    [state.sharedToolBindings]
  );
  const getMyWorkProjection = useCallback((): MyWorkProjection => {
    const attention = state.issues
      .filter(
        (issue) =>
          issue.waitingForCurrentUser ||
          issue.status === "in_review" ||
          issue.executionFailed
      )
      .map((issue) => issue.id);
    const running = state.issues
      .filter(
        (issue) =>
          issue.status === "in_progress" || issue.status === "changes_requested"
      )
      .map((issue) => issue.id);
    const recent = state.issues
      .filter((issue) => issue.status === "done")
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
      .slice(0, 5)
      .map((issue) => issue.id);
    const projectIds = state.projects
      .filter(
        (project) =>
          project.status === "active" &&
          project.humanMemberIds.includes(CURRENT_USER_ID)
      )
      .map((project) => project.id);

    if (
      attention.length === 0 &&
      running.length === 0 &&
      recent.length === 0
    ) {
      return SEED_MY_WORK;
    }

    return {
      userId: CURRENT_USER_ID,
      attentionIssueIds: attention.length
        ? attention
        : SEED_MY_WORK.attentionIssueIds,
      runningIssueIds: running.length ? running : SEED_MY_WORK.runningIssueIds,
      recentDeliveryIssueIds: recent.length
        ? recent
        : SEED_MY_WORK.recentDeliveryIssueIds,
      projectIds: projectIds.length ? projectIds : SEED_MY_WORK.projectIds,
      updatedAt: nowIso(),
    };
  }, [state.issues, state.projects]);

  const openDrawer = useCallback(
    (kind: Exclude<ProjectDrawerKind, null>, invocationId?: string) => {
      setState((prev) => ({
        ...prev,
        activeDrawer: kind,
        activeInvocationId:
          kind === "execution"
            ? invocationId ?? prev.activeInvocationId
            : prev.activeInvocationId,
        activeIssueId: kind === "issue" ? prev.activeIssueId : prev.activeIssueId,
        scrollAnchorMessageId:
          prev.highlightedMessageId ?? prev.scrollAnchorMessageId,
      }));
    },
    []
  );

  const openIssueDrawer = useCallback((issueId: string) => {
    setState((prev) => ({
      ...prev,
      activeDrawer: "issue",
      activeIssueId: issueId,
      scrollAnchorMessageId:
        prev.highlightedMessageId ?? prev.scrollAnchorMessageId,
    }));
  }, []);

  const closeDrawer = useCallback(() => {
    setState((prev) => ({
      ...prev,
      activeDrawer: null,
      activeInvocationId: null,
      activeIssueId: null,
    }));
  }, []);

  const openExecution = useCallback((invocationId: string) => {
    setState((prev) => ({
      ...prev,
      activeDrawer: "execution",
      activeInvocationId: invocationId,
      scrollAnchorMessageId: prev.highlightedMessageId ?? prev.scrollAnchorMessageId,
    }));
  }, []);

  const setHighlightedMessage = useCallback((messageId: string | null) => {
    setState((prev) => ({
      ...prev,
      highlightedMessageId: messageId,
      scrollAnchorMessageId: messageId ?? prev.scrollAnchorMessageId,
    }));
  }, []);

  const markInboxRead = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      inbox: prev.inbox.map((item) =>
        item.id === id ? { ...item, read: true } : item
      ),
    }));
  }, []);

  const appendSystemMessage = useCallback(
    (
      draft: ProjectConversationState,
      project: CollaborationProject,
      content: string
    ) => {
      const message: ProjectMessage = {
        id: createId("msg"),
        workspaceId: project.workspaceId,
        projectId: project.id,
        threadId: project.threadId,
        kind: "system",
        author: { kind: "system", id: "system" },
        content,
        mentionedHumanIds: [],
        mentionedActorIds: [],
        quotedMessageIds: [],
        fileIds: [],
        artifactIds: [],
        invocationIds: [],
        createdAt: nowIso(),
      };
      draft.messages = [...draft.messages, message];
      draft.threads = draft.threads.map((thread) =>
        thread.id === project.threadId
          ? {
              ...thread,
              messageIds: [...thread.messageIds, message.id],
              updatedAt: nowIso(),
            }
          : thread
      );
    },
    []
  );

  const scheduleInvocationProgress = useCallback(
    (invocationId: string, actorId: string, withDelegation: boolean) => {
      const actor = getActorById(actorId);
      if (actor?.runtimeStatus === "offline") {
        const failTimer = window.setTimeout(() => {
          setState((prev) => {
            const inv = prev.invocations.find((item) => item.id === invocationId);
            if (!inv || inv.status === "cancelled" || inv.status === "completed") {
              return prev;
            }
            const next = structuredClone(prev);
            next.invocations = next.invocations.map((item) =>
              item.id === invocationId
                ? {
                    ...item,
                    status: "failed",
                    errorCode: "RUNTIME_OFFLINE",
                    errorMessage: "Runtime offline",
                    completedAt: nowIso(),
                  }
                : item
            );
            next.events = [
              ...next.events,
              {
                id: createId("evt"),
                invocationId,
                kind: "error",
                label: "执行失败",
                detail: "Runtime offline",
                at: nowIso(),
              },
            ];
            next.inbox = [
              {
                id: createId("inbox"),
                type: "agent_execution_failed",
                title: `${actor.name} 执行失败`,
                body: "Runtime offline",
                createdAt: nowIso(),
                read: false,
                workspaceId: inv.workspaceId,
                projectId: inv.projectId,
                threadId: inv.threadId,
                messageId: inv.sourceMessageId,
                invocationId,
                actorId,
              },
              ...next.inbox,
            ];
            return next;
          });
        }, 1200);
        timersRef.current[`${invocationId}-fail`] = failTimer;
        return;
      }

      const runTimer = window.setTimeout(() => {
        setState((prev) => {
          const inv = prev.invocations.find((item) => item.id === invocationId);
          if (!inv || inv.status === "cancelled" || inv.status === "failed") {
            return prev;
          }
          const next = structuredClone(prev);
          next.invocations = next.invocations.map((item) =>
            item.id === invocationId
              ? { ...item, status: "running", startedAt: item.startedAt ?? nowIso() }
              : item
          );
          next.events = [
            ...next.events,
            {
              id: createId("evt"),
              invocationId,
              kind: "daemon_trigger",
              label: "Daemon 传入触发",
              at: nowIso(),
              display: {
                type: "daemon",
                content: `[Daemon] mode=request · target=${actorId}\n\n已投递 Trigger Envelope，启动 Agent Session。`,
                attachments: ["Trigger Envelope.json"],
              },
            },
            {
              id: createId("evt"),
              invocationId,
              kind: "thinking",
              label: "接收请求",
              at: nowIso(),
              display: {
                type: "thinking",
                content: "已接收 Daemon 请求，开始规划执行步骤…",
                status: "running",
              },
            },
          ];
          return next;
        });
      }, 700);
      timersRef.current[`${invocationId}-run`] = runTimer;

      const skillTimer = window.setTimeout(() => {
        setState((prev) => {
          const inv = prev.invocations.find((item) => item.id === invocationId);
          if (!inv || inv.status !== "running") return prev;
          const actor = prev.actors.find((item) => item.id === actorId);
          return {
            ...prev,
            events: [
              ...prev.events,
              {
                id: createId("evt"),
                invocationId,
                kind: "skill",
                label: `调用${actor?.name ?? "Agent"} Skill`,
                at: nowIso(),
                display: {
                  type: "action",
                  actionKind: "skill",
                  status: "done",
                  logs: ["读取触发消息与近期上下文", "生成执行计划"],
                },
              },
              {
                id: createId("evt"),
                invocationId,
                kind: "tool_call",
                label: "调用项目插件",
                at: nowIso(),
                display: {
                  type: "action",
                  actionKind: "tool",
                  status: "done",
                  logs: ["插件：Project Knowledge Search", "已注入相关片段"],
                },
              },
            ],
          };
        });
      }, 1400);
      timersRef.current[`${invocationId}-skill`] = skillTimer;

      if (withDelegation) {
        const dlgTimer = window.setTimeout(() => {
          setState((prev) => {
            const inv = prev.invocations.find((item) => item.id === invocationId);
            if (!inv || inv.status !== "running") return prev;
            const project = prev.projects.find((item) => item.id === inv.projectId);
            if (!project) return prev;
            const targetId =
              project.agentMemberIds.find(
                (id) => id !== actorId && id === "actor-product-design"
              ) ?? project.agentMemberIds.find((id) => id !== actorId);
            if (!targetId) return prev;
            const target = prev.actors.find((item) => item.id === targetId);
            const delegationId = createId("dlg");
            const next = structuredClone(prev);
            next.delegations = [
              ...next.delegations,
              {
                id: delegationId,
                workspaceId: inv.workspaceId,
                projectId: inv.projectId,
                parentInvocationId: invocationId,
                sourceActorId: actorId,
                targetActorId: targetId,
                requestSummary: "请产出配套设计文档",
                status: "running",
                acceptedAt: nowIso(),
              },
            ];
            next.invocations = next.invocations.map((item) =>
              item.id === invocationId
                ? {
                    ...item,
                    delegationIds: [...item.delegationIds, delegationId],
                  }
                : item
            );
            next.events = [
              ...next.events,
              {
                id: createId("evt"),
                invocationId,
                kind: "delegation",
                label: `委派 ${target?.name ?? "Agent"}`,
                detail: target?.name,
                at: nowIso(),
                display: {
                  type: "delegation",
                  status: "running",
                  targetActorId: targetId,
                  targetActorName: target?.name,
                  logs: ["request → accepted → running"],
                },
              },
            ];
            return next;
          });
        }, 2200);
        timersRef.current[`${invocationId}-dlg`] = dlgTimer;
      }

      const sandboxTimer = window.setTimeout(() => {
        setState((prev) => {
          const inv = prev.invocations.find((item) => item.id === invocationId);
          if (!inv || inv.status !== "running") return prev;
          return {
            ...prev,
            events: [
              ...prev.events,
              {
                id: createId("evt"),
                invocationId,
                kind: "sandbox",
                label: "沙箱写入产物",
                at: nowIso(),
                display: {
                  type: "action",
                  actionKind: "tool",
                  status: "done",
                  logs: [
                    "机制：Sandbox File Writer",
                    "已生成 Markdown 产物，等待发布到 Project",
                  ],
                },
              },
            ],
          };
        });
      }, withDelegation ? 3000 : 2000);
      timersRef.current[`${invocationId}-sandbox`] = sandboxTimer;

      const completeTimer = window.setTimeout(() => {
        setState((prev) => {
          const inv = prev.invocations.find((item) => item.id === invocationId);
          if (!inv || inv.status === "cancelled" || inv.status === "failed") {
            return prev;
          }
          if (inv.responseMessageId) return prev;
          const actor = prev.actors.find((item) => item.id === actorId);
          const project = prev.projects.find((item) => item.id === inv.projectId);
          if (!actor || !project) return prev;

          const replyId = createId("msg");
          const artifactId = createId("art");
          const next = structuredClone(prev);

          next.delegations = next.delegations.map((item) =>
            inv.delegationIds.includes(item.id)
              ? { ...item, status: "responded", respondedAt: nowIso() }
              : item
          );

          const reply: ProjectMessage = {
            id: replyId,
            workspaceId: inv.workspaceId,
            projectId: inv.projectId,
            threadId: inv.threadId,
            kind: "agent_reply",
            author: { kind: "agent", id: actorId },
            content: `${actor.name} 已完成你的请求。\n\n基于当前 Project 公共上下文，给出了可直接审阅的结果摘要。如需调整，可要求返工。`,
            replyToMessageId: inv.sourceMessageId,
            mentionedHumanIds: [],
            mentionedActorIds: [],
            quotedMessageIds: [],
            fileIds: [],
            artifactIds: [artifactId],
            invocationIds: [invocationId],
            agentReview: { status: "unreviewed" },
            createdAt: nowIso(),
          };

          next.messages = [...next.messages, reply];
          next.artifacts = [
            ...next.artifacts,
            {
              id: artifactId,
              workspaceId: inv.workspaceId,
              projectId: inv.projectId,
              sourceMessageId: replyId,
              invocationId,
              name: `${actor.name} 结果摘要.md`,
              kind: "report",
              createdBy: { kind: "agent", id: actorId },
              visibility: "project",
              createdAt: nowIso(),
            },
          ];
          next.invocations = next.invocations.map((item) =>
            item.id === invocationId
              ? {
                  ...item,
                  status: "completed",
                  responseMessageId: replyId,
                  artifactIds: [...item.artifactIds, artifactId],
                  completedAt: nowIso(),
                  summary: `${actor.name} 已回复`,
                }
              : item
          );
          next.events = [
            ...next.events,
            {
              id: createId("evt"),
              invocationId,
              kind: "artifact",
              label: "生成 Artifact",
              detail: `${actor.name} 结果摘要.md`,
              at: nowIso(),
              display: {
                type: "action",
                actionKind: "tool",
                status: "done",
                logs: [`发布：${actor.name} 结果摘要.md`],
              },
            },
            {
              id: createId("evt"),
              invocationId,
              kind: "response",
              label: "回传结果",
              at: nowIso(),
              display: {
                type: "output",
                content: `${actor.name} 已完成请求，结果已回传到 Project Conversation。`,
                attachments: [`${actor.name} 结果摘要.md`],
              },
            },
          ];
          next.threads = next.threads.map((thread) =>
            thread.id === inv.threadId
              ? {
                  ...thread,
                  messageIds: [...thread.messageIds, replyId],
                  updatedAt: nowIso(),
                }
              : thread
          );
          next.sessions = next.sessions.map((session) =>
            session.id === inv.sessionId
              ? {
                  ...session,
                  lastSummary: `${actor.name} 已回复`,
                  updatedAt: nowIso(),
                }
              : session
          );
          next.inbox = [
            {
              id: createId("inbox"),
              type: "agent_reply_ready",
              title: `${actor.name} 已回复`,
              body: "结果已回到 Project Conversation，待验收",
              createdAt: nowIso(),
              read: false,
              workspaceId: inv.workspaceId,
              projectId: inv.projectId,
              threadId: inv.threadId,
              messageId: replyId,
              invocationId,
              actorId,
            },
            ...next.inbox,
          ];

          const nextQueued = next.invocations
            .filter(
              (item) =>
                item.projectId === inv.projectId &&
                item.actorId === actorId &&
                !item.parentInvocationId &&
                item.status === "queued"
            )
            .sort(
              (a, b) =>
                new Date(a.startedAt ?? a.id).getTime() -
                new Date(b.startedAt ?? b.id).getTime()
            )[0];
          if (nextQueued) {
            window.setTimeout(() => {
              scheduleInvocationProgressRef.current(
                nextQueued.id,
                actorId,
                false
              );
            }, 120);
          }

          return next;
        });
      }, withDelegation ? 4200 : 2800);
      timersRef.current[`${invocationId}-done`] = completeTimer;
    },
    []
  );

  useEffect(() => {
    scheduleInvocationProgressRef.current = scheduleInvocationProgress;
  }, [scheduleInvocationProgress]);

  const createInvocationForAgent = useCallback(
    (
      draft: ProjectConversationState,
      project: CollaborationProject,
      sourceMessage: ProjectMessage,
      actorId: string,
      sessionPolicy: "continue" | "new",
      attemptNumber: number
    ) => {
      const actor = draft.actors.find((item) => item.id === actorId);
      if (!actor) return null;

      let session = draft.sessions.find(
        (item) =>
          item.projectId === project.id &&
          item.actorId === actorId &&
          item.status === "active"
      );

      if (sessionPolicy === "new" || !session) {
        session = {
          id: createId("session"),
          workspaceId: project.workspaceId,
          projectId: project.id,
          threadId: project.threadId,
          actorId,
          status: "active",
          invocationIds: [],
          lastSummary: "新会话已创建",
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        draft.sessions = [...draft.sessions, session];
      }

      const invocationId = createId("inv");
      const hasRunningForActor = draft.invocations.some(
        (item) =>
          item.projectId === project.id &&
          item.actorId === actorId &&
          !item.parentInvocationId &&
          (item.status === "running" || item.status === "queued")
      );
      const invocation: AgentInvocation = {
        id: invocationId,
        workspaceId: project.workspaceId,
        projectId: project.id,
        threadId: project.threadId,
        sourceMessageId: sourceMessage.id,
        sessionId: session.id,
        actorId,
        status: "queued",
        inputRefs: [sourceMessage.id, ...sourceMessage.quotedMessageIds],
        delegationIds: [],
        artifactIds: [],
        eventIds: [],
        summary: hasRunningForActor ? "排队等待同 Session 执行" : "等待执行",
        startedAt: nowIso(),
        attemptNumber,
      };

      draft.invocations = [...draft.invocations, invocation];
      draft.sessions = draft.sessions.map((item) =>
        item.id === session!.id
          ? {
              ...item,
              invocationIds: [...item.invocationIds, invocationId],
              updatedAt: nowIso(),
            }
          : item
      );

      return { invocationId, deferred: hasRunningForActor };
    },
    []
  );

  const sendMessage = useCallback(
    (payload: SendMessagePayload) => {
      const project = state.projects.find((item) => item.id === payload.projectId);
      if (!project) return { ok: false as const, error: "Project 不存在，请刷新后重试" };
      if (project.status === "archived") {
        return { ok: false as const, error: "项目已归档，无法发送消息" };
      }
      if (payload.mentionedActorIds.length > 3) {
        return {
          ok: false as const,
          error: "单次最多指派 3 个 Agent，请拆分消息",
        };
      }

      const members = state.membersByProject[project.id] ?? [];
      for (const actorId of payload.mentionedActorIds) {
        const member = members.find(
          (item) => item.kind === "agent" && item.actorId === actorId
        );
        if (!member || member.state === "pending_consent") {
          return {
            ok: false as const,
            error: "只能触发当前 Project 中可执行的 Agent Member",
          };
        }
      }

      const messageId = createId("msg");
      const message: ProjectMessage = {
        id: messageId,
        workspaceId: project.workspaceId,
        projectId: project.id,
        threadId: project.threadId,
        kind: "human",
        author: { kind: "human", id: CURRENT_USER_ID },
        content: payload.content,
        mentionedHumanIds: payload.mentionedHumanIds,
        mentionedActorIds: payload.mentionedActorIds,
        quotedMessageIds: payload.quotedMessageIds,
        fileIds: payload.fileIds,
        artifactIds: [],
        invocationIds: [],
        createdAt: nowIso(),
      };

      const draft = structuredClone(state);
      draft.messages = [...draft.messages, message];
      draft.threads = draft.threads.map((thread) =>
        thread.id === project.threadId
          ? {
              ...thread,
              messageIds: [...thread.messageIds, messageId],
              updatedAt: nowIso(),
            }
          : thread
      );

      for (const humanId of payload.mentionedHumanIds) {
        if (humanId === CURRENT_USER_ID) continue;
        draft.inbox = [
          {
            id: createId("inbox"),
            type: "human_mentioned",
            title: `${getUserById(CURRENT_USER_ID)?.name ?? "同事"} @了你`,
            body: payload.content.slice(0, 80),
            createdAt: nowIso(),
            read: false,
            workspaceId: project.workspaceId,
            projectId: project.id,
            threadId: project.threadId,
            messageId,
          },
          ...draft.inbox,
        ];
      }

      const created: Array<{
        invocationId: string;
        actorId: string;
        deferred: boolean;
      }> = [];
      for (const actorId of payload.mentionedActorIds) {
        const createdInv = createInvocationForAgent(
          draft,
          project,
          message,
          actorId,
          "continue",
          1
        );
        if (createdInv) {
          created.push({
            invocationId: createdInv.invocationId,
            actorId,
            deferred: createdInv.deferred,
          });
        }
      }

      if (created.length > 0) {
        draft.messages = draft.messages.map((item) =>
          item.id === messageId
            ? { ...item, invocationIds: created.map((c) => c.invocationId) }
            : item
        );
      }

      // Issue Steward (prototype): propose / auto-create work items; greetings stay chat-only.
      if (payload.mentionedActorIds.length > 0) {
        const stripped = payload.content
          .replace(/@[^\s]+/g, "")
          .trim();
        const isGreetingOnly =
          /^(hi|hello|你好|嗨)[!！.。\s]*$/i.test(stripped) ||
          stripped.length === 0;
        if (!isGreetingOnly) {
          const confidence =
            /审阅|调研|PRD|报告|怎么看|帮我|实现|输出/.test(payload.content)
              ? 0.9
              : 0.6;
          const proposalId = createId("proposal");
          const proposedTitle =
            stripped.length > 28 ? `${stripped.slice(0, 28)}…` : stripped || "跟进事项";
          const proposal: IssueMutationProposal = {
            id: proposalId,
            projectId: project.id,
            action: "create",
            proposedTitle,
            proposedSummary: payload.content.slice(0, 120),
            proposedStatus: "clarifying",
            proposedHumanAssigneeIds: [CURRENT_USER_ID],
            proposedAgentAssigneeIds: payload.mentionedActorIds.slice(0, 1),
            evidenceMessageIds: [messageId],
            confidence,
            reason: "消息包含可跟踪的工作对象或预期结果",
            requiresConfirmation: confidence < 0.85,
            createdAt: nowIso(),
          };
          draft.issueProposals = [proposal, ...draft.issueProposals];

          if (confidence >= 0.85) {
            const issueId = createId("issue");
            const issueCount = draft.issues.filter(
              (item) => item.projectId === project.id
            ).length;
            draft.lastAppliedProposalSnapshot = {
              proposalId,
              issues: structuredClone(draft.issues),
              projects: structuredClone(draft.projects),
            };
            draft.issues = [
              ...draft.issues,
              {
                id: issueId,
                projectId: project.id,
                key: `AUTO-${issueCount + 1}`,
                title: proposedTitle,
                summary: payload.content.slice(0, 120),
                status: "clarifying",
                sourceMessageId: messageId,
                relatedMessageIds: [messageId],
                humanAssigneeIds: [CURRENT_USER_ID],
                agentAssigneeIds: payload.mentionedActorIds.slice(0, 1),
                invocationIds: created.map((c) => c.invocationId),
                artifactIds: [],
                acceptanceCriteria: [],
                latestProgress: "事项管家已自动创建，可撤销",
                createdBy: { kind: "issue_steward", id: "steward" },
                createdAt: nowIso(),
                updatedAt: nowIso(),
                revision: 1,
              },
            ];
            draft.projects = draft.projects.map((item) =>
              item.id === project.id
                ? {
                    ...item,
                    issueIds: [...(item.issueIds ?? []), issueId],
                    updatedAt: nowIso(),
                  }
                : item
            );
            draft.issueProposals = draft.issueProposals.map((item) =>
              item.id === proposalId
                ? { ...item, dismissed: true, targetIssueId: issueId }
                : item
            );
            draft.inbox = [
              {
                id: createId("inbox"),
                type: "issue_created",
                title: `已创建事项：${proposedTitle}`,
                body: "事项管家自动识别，可在事项看板查看或撤销",
                createdAt: nowIso(),
                read: false,
                projectId: project.id,
                messageId,
                issueId,
                sourceType: "issue",
                href: `/my-claw/projects/${project.id}?view=issues&issue=${issueId}`,
              },
              ...draft.inbox,
            ];
          }
        }
      }

      // Preserve UI-only fields
      draft.activeDrawer = state.activeDrawer;
      draft.activeInvocationId = state.activeInvocationId;
      draft.activeIssueId = state.activeIssueId;
      draft.highlightedMessageId = state.highlightedMessageId;
      draft.scrollAnchorMessageId = state.scrollAnchorMessageId;

      setState(draft);

      for (const item of created) {
        if (item.deferred) continue;
        const shouldDelegate =
          item.actorId === "actor-req-analysis" || payload.content.includes("委派");
        scheduleInvocationProgress(item.invocationId, item.actorId, shouldDelegate);
      }

      return { ok: true as const };
    },
    [
      createInvocationForAgent,
      scheduleInvocationProgress,
      state,
    ]
  );

  const cancelInvocation = useCallback((invocationId: string) => {
    Object.entries(timersRef.current).forEach(([key, timer]) => {
      if (key.startsWith(invocationId)) {
        window.clearTimeout(timer);
        delete timersRef.current[key];
      }
    });
    setState((prev) => {
      const target = prev.invocations.find((item) => item.id === invocationId);
      const next: ProjectConversationState = {
        ...prev,
        invocations: prev.invocations.map((item) =>
          item.id === invocationId &&
          (item.status === "queued" || item.status === "running")
            ? { ...item, status: "cancelled", completedAt: nowIso() }
            : item
        ),
      };
      if (target) {
        const queued = next.invocations
          .filter(
            (item) =>
              item.projectId === target.projectId &&
              item.actorId === target.actorId &&
              !item.parentInvocationId &&
              item.status === "queued"
          )
          .sort(
            (a, b) =>
              new Date(a.startedAt ?? a.id).getTime() -
              new Date(b.startedAt ?? b.id).getTime()
          )[0];
        if (queued) {
          window.setTimeout(() => {
            scheduleInvocationProgressRef.current(
              queued.id,
              target.actorId,
              false
            );
          }, 80);
        }
      }
      return next;
    });
  }, []);

  const retryInvocation = useCallback(
    (invocationId: string, sessionPolicy: "continue" | "new") => {
      const current = state.invocations.find((item) => item.id === invocationId);
      const project = current
        ? state.projects.find((item) => item.id === current.projectId)
        : undefined;
      const sourceMessage = current
        ? state.messages.find((item) => item.id === current.sourceMessageId)
        : undefined;
      if (!current || !project || !sourceMessage) return;

      const draft = structuredClone(state);
      const attemptNumber =
        Math.max(
          ...draft.invocations
            .filter(
              (item) =>
                item.sourceMessageId === current.sourceMessageId &&
                item.actorId === current.actorId
            )
            .map((item) => item.attemptNumber),
          0
        ) + 1;

      const newInv = createInvocationForAgent(
        draft,
        project,
        sourceMessage,
        current.actorId,
        sessionPolicy,
        attemptNumber
      );
      if (!newInv) return;

      draft.messages = draft.messages.map((item) =>
        item.id === sourceMessage.id
          ? {
              ...item,
              invocationIds: [...item.invocationIds, newInv.invocationId],
            }
          : item
      );
      draft.activeDrawer = state.activeDrawer;
      draft.activeInvocationId = newInv.invocationId;
      draft.activeIssueId = state.activeIssueId;
      draft.highlightedMessageId = state.highlightedMessageId;
      draft.scrollAnchorMessageId = state.scrollAnchorMessageId;
      setState(draft);
      if (!newInv.deferred) {
        scheduleInvocationProgress(newInv.invocationId, current.actorId, false);
      }
    },
    [createInvocationForAgent, scheduleInvocationProgress, state]
  );

  const acceptAgentReply = useCallback(
    (messageId: string) => {
      setState((prev) => {
        const message = prev.messages.find((item) => item.id === messageId);
        const project = message
          ? prev.projects.find((item) => item.id === message.projectId)
          : undefined;
        if (!message || !project || message.kind !== "agent_reply") return prev;
        const next = structuredClone(prev);
        next.messages = next.messages.map((item) =>
          item.id === messageId
            ? {
                ...item,
                agentReview: {
                  status: "accepted",
                  reviewedByUserId: CURRENT_USER_ID,
                  reviewedAt: nowIso(),
                },
              }
            : item
        );
        appendSystemMessage(
          next,
          project,
          `${getUserById(CURRENT_USER_ID)?.name ?? "成员"}已接受 ${
            getActorById(message.author.kind === "agent" ? message.author.id : "")
              ?.name ?? "Agent"
          } 的回复`
        );
        return next;
      });
    },
    [appendSystemMessage]
  );

  const requestAgentChanges = useCallback(
    (messageId: string, feedback: string) => {
      const message = state.messages.find((item) => item.id === messageId);
      const project = message
        ? state.projects.find((item) => item.id === message.projectId)
        : undefined;
      if (!message || !project || message.author.kind !== "agent") return;

      const feedbackId = createId("msg");
      const feedbackMessage: ProjectMessage = {
        id: feedbackId,
        workspaceId: project.workspaceId,
        projectId: project.id,
        threadId: project.threadId,
        kind: "human",
        author: { kind: "human", id: CURRENT_USER_ID },
        content: feedback,
        replyToMessageId: messageId,
        mentionedHumanIds: [],
        mentionedActorIds: [message.author.id],
        quotedMessageIds: [],
        fileIds: [],
        artifactIds: [],
        invocationIds: [],
        createdAt: nowIso(),
      };

      const draft = structuredClone(state);
      draft.messages = draft.messages.map((item) =>
        item.id === messageId
          ? {
              ...item,
              agentReview: {
                status: "changes_requested",
                reviewedByUserId: CURRENT_USER_ID,
                reviewedAt: nowIso(),
                feedbackMessageId: feedbackId,
              },
            }
          : item
      );
      draft.messages = [...draft.messages, feedbackMessage];
      draft.threads = draft.threads.map((thread) =>
        thread.id === project.threadId
          ? {
              ...thread,
              messageIds: [...thread.messageIds, feedbackId],
              updatedAt: nowIso(),
            }
          : thread
      );

      const attemptNumber =
        Math.max(
          ...draft.invocations
            .filter(
              (item) =>
                item.actorId === message.author.id &&
                (item.sourceMessageId === message.replyToMessageId ||
                  item.responseMessageId === messageId)
            )
            .map((item) => item.attemptNumber),
          0
        ) + 1;

      const createdInv = createInvocationForAgent(
        draft,
        project,
        feedbackMessage,
        message.author.id,
        "continue",
        attemptNumber
      );
      if (createdInv) {
        draft.messages = draft.messages.map((item) =>
          item.id === feedbackId
            ? { ...item, invocationIds: [createdInv.invocationId] }
            : item
        );
      }

      draft.activeDrawer = state.activeDrawer;
      draft.activeInvocationId = state.activeInvocationId;
      draft.activeIssueId = state.activeIssueId;
      draft.highlightedMessageId = state.highlightedMessageId;
      draft.scrollAnchorMessageId = state.scrollAnchorMessageId;
      setState(draft);
      if (createdInv && !createdInv.deferred) {
        scheduleInvocationProgress(
          createdInv.invocationId,
          message.author.id,
          false
        );
      }
    },
    [createInvocationForAgent, scheduleInvocationProgress, state]
  );

  const resolvePersonalClawConsent = useCallback(
    (projectId: string, actorId: string, decision: "accept" | "reject") => {
      setState((prev) => {
        const next = structuredClone(prev);
        const members = next.membersByProject[projectId] ?? [];
        if (decision === "accept") {
          next.membersByProject[projectId] = members.map((item) =>
            item.kind === "agent" && item.actorId === actorId
              ? { ...item, state: "active" }
              : item
          );
        } else {
          next.membersByProject[projectId] = members.filter(
            (item) => !(item.kind === "agent" && item.actorId === actorId)
          );
          next.projects = next.projects.map((project) =>
            project.id === projectId
              ? {
                  ...project,
                  agentMemberIds: project.agentMemberIds.filter(
                    (id) => id !== actorId
                  ),
                }
              : project
          );
        }
        next.inbox = next.inbox.map((item) =>
          item.projectId === projectId &&
          item.actorId === actorId &&
          item.type === "personal_claw_consent"
            ? { ...item, read: true }
            : item
        );
        return next;
      });
    },
    []
  );

  const addHumanMember = useCallback((projectId: string, userId: string) => {
    setState((prev) => {
      const members = prev.membersByProject[projectId] ?? [];
      if (members.some((item) => item.kind === "human" && item.userId === userId)) {
        return prev;
      }
      const next = structuredClone(prev);
      next.membersByProject[projectId] = [
        ...members,
        { kind: "human", userId, role: "member", state: "active" },
      ];
      next.projects = next.projects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              humanMemberIds: [...project.humanMemberIds, userId],
            }
          : project
      );
      return next;
    });
  }, []);

  const addAgentMember = useCallback((projectId: string, actorId: string) => {
    setState((prev) => {
      const actor = prev.actors.find((item) => item.id === actorId);
      if (!actor) return prev;
      const members = prev.membersByProject[projectId] ?? [];
      if (members.some((item) => item.kind === "agent" && item.actorId === actorId)) {
        return prev;
      }
      const next = structuredClone(prev);
      if (actor.type === "personal_claw" && actor.ownerUserId) {
        const hasOwner = members.some(
          (item) => item.kind === "human" && item.userId === actor.ownerUserId
        );
        if (!hasOwner) {
          next.membersByProject[projectId] = [
            ...(next.membersByProject[projectId] ?? []),
            {
              kind: "human",
              userId: actor.ownerUserId,
              role: "member",
              state: "invited",
            },
          ];
          next.projects = next.projects.map((project) =>
            project.id === projectId
              ? {
                  ...project,
                  humanMemberIds: [...project.humanMemberIds, actor.ownerUserId!],
                }
              : project
          );
        }
      }
      const pending =
        actor.type === "personal_claw" && actor.ownerUserId !== CURRENT_USER_ID;
      next.membersByProject[projectId] = [
        ...(next.membersByProject[projectId] ?? []),
        {
          kind: "agent",
          actorId,
          actorType: actor.type,
          state: pending
            ? "pending_consent"
            : actor.runtimeStatus === "offline"
              ? "offline"
              : actor.runtimeStatus === "degraded"
                ? "degraded"
                : "active",
        },
      ];
      next.projects = next.projects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              agentMemberIds: [...project.agentMemberIds, actorId],
            }
          : project
      );
      return next;
    });
  }, []);

  const removeMember = useCallback((projectId: string, memberRef: string) => {
    setState((prev) => {
      const next = structuredClone(prev);
      next.membersByProject[projectId] = (next.membersByProject[projectId] ?? []).filter(
        (item) =>
          !(
            (item.kind === "human" && item.userId === memberRef) ||
            (item.kind === "agent" && item.actorId === memberRef)
          )
      );
      next.projects = next.projects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              humanMemberIds: project.humanMemberIds.filter((id) => id !== memberRef),
              agentMemberIds: project.agentMemberIds.filter((id) => id !== memberRef),
            }
          : project
      );
      return next;
    });
  }, []);

  const archiveProject = useCallback((projectId: string) => {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((project) =>
        project.id === projectId
          ? { ...project, status: "archived", updatedAt: nowIso() }
          : project
      ),
      activeDrawer: null,
    }));
  }, []);

  const updateProjectBrief = useCallback((projectId: string, brief: string) => {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((project) =>
        project.id === projectId
          ? { ...project, brief, updatedAt: nowIso() }
          : project
      ),
    }));
  }, []);

  const restoreActorOnline = useCallback((actorId: string) => {
    setState((prev) => ({
      ...prev,
      actors: prev.actors.map((actor) =>
        actor.id === actorId
          ? {
              ...actor,
              runtimeStatus: "online",
              lastHeartbeatAt: nowIso(),
            }
          : actor
      ),
    }));
  }, []);

  const addGitHubWorkSource = useCallback(
    (projectId: string, repoInput: string) => {
      const trimmed = repoInput.trim();
      if (!trimmed) {
        return { ok: false as const, error: "请输入 GitHub 仓库地址" };
      }

      const match =
        trimmed.match(
          /(?:https?:\/\/github\.com\/)?([^/\s]+)\/([^/\s#?]+?)(?:\.git)?\/?$/i
        ) ?? trimmed.match(/^([^/\s]+)\/([^/\s]+)$/);
      if (!match) {
        return {
          ok: false as const,
          error: "格式需为 owner/repo 或 https://github.com/owner/repo",
        };
      }

      const owner = match[1];
      const repo = match[2].replace(/\.git$/i, "");
      const name = `${owner}/${repo}`;
      const detail = `github.com/${owner}/${repo} · main`;

      setState((prev) => {
        const project = prev.projects.find((item) => item.id === projectId);
        if (!project || project.status === "archived") return prev;

        const duplicate = prev.workSources.some(
          (item) =>
            item.projectId === projectId &&
            item.type === "github_repository" &&
            item.name.toLowerCase() === name.toLowerCase()
        );
        if (duplicate) return prev;

        const sourceId = createId("ws-gh");
        return {
          ...prev,
          workSources: [
            ...prev.workSources,
            {
              id: sourceId,
              projectId,
              type: "github_repository",
              name,
              detail,
              access: "read",
              availability: "available",
            },
          ],
          projects: prev.projects.map((item) =>
            item.id === projectId
              ? {
                  ...item,
                  workSourceIds: [...item.workSourceIds, sourceId],
                  updatedAt: nowIso(),
                }
              : item
          ),
        };
      });

      return { ok: true as const };
    },
    []
  );

  const addLocalWorkSource = useCallback(
    (projectId: string, displayName: string, localPath: string) => {
      const name = displayName.trim() || "本地工作区";
      const path = localPath.trim();
      if (!path) {
        return { ok: false as const, error: "请输入本地目录路径" };
      }

      setState((prev) => {
        const project = prev.projects.find((item) => item.id === projectId);
        if (!project || project.status === "archived") return prev;

        const hasLocal = prev.workSources.some(
          (item) =>
            item.projectId === projectId && item.type === "local_directory"
        );
        if (hasLocal) return prev;

        const sourceId = createId("ws-local");
        return {
          ...prev,
          workSources: [
            ...prev.workSources,
            {
              id: sourceId,
              projectId,
              type: "local_directory",
              name,
              detail: path,
              access: "read_write",
              availability: "available",
              runtimeActorId: "actor-coding",
            },
          ],
          projects: prev.projects.map((item) =>
            item.id === projectId
              ? {
                  ...item,
                  workSourceIds: [...item.workSourceIds, sourceId],
                  updatedAt: nowIso(),
                }
              : item
          ),
        };
      });

      return { ok: true as const };
    },
    []
  );

  const removeWorkSource = useCallback(
    (projectId: string, sourceId: string) => {
      setState((prev) => ({
        ...prev,
        workSources: prev.workSources.filter((item) => item.id !== sourceId),
        projects: prev.projects.map((item) =>
          item.id === projectId
            ? {
                ...item,
                workSourceIds: item.workSourceIds.filter((id) => id !== sourceId),
                updatedAt: nowIso(),
              }
            : item
        ),
      }));
    },
    []
  );

  const createIssue = useCallback((payload: CreateIssuePayload) => {
    const project = state.projects.find((item) => item.id === payload.projectId);
    if (!project) return null;
    const issueId = createId("issue");
    const key = `${project.name.slice(0, 4).toUpperCase()}-${
      state.issues.filter((item) => item.projectId === project.id).length + 1
    }`;
    const issue: ProjectIssue = {
      id: issueId,
      projectId: project.id,
      key,
      title: payload.title,
      summary: payload.summary ?? "",
      status: "clarifying",
      sourceMessageId: payload.sourceMessageId,
      relatedMessageIds: payload.sourceMessageId ? [payload.sourceMessageId] : [],
      humanAssigneeIds: payload.humanAssigneeIds,
      agentAssigneeIds: payload.agentAssigneeIds,
      invocationIds: [],
      artifactIds: [],
      acceptanceCriteria: payload.acceptanceCriteria ?? [],
      createdBy: { kind: "human", id: CURRENT_USER_ID },
      createdAt: nowIso(),
      updatedAt: nowIso(),
      revision: 1,
    };
    setState((prev) => ({
      ...prev,
      issues: [issue, ...prev.issues],
      projects: prev.projects.map((item) =>
        item.id === project.id
          ? {
              ...item,
              issueIds: [...item.issueIds, issueId],
              updatedAt: nowIso(),
            }
          : item
      ),
    }));
    return issueId;
  }, [state.issues, state.projects]);

  const updateIssue = useCallback((issueId: string, patch: IssueUpdatePatch) => {
    setState((prev) => ({
      ...prev,
      issues: prev.issues.map((item) =>
        item.id === issueId
          ? {
              ...item,
              ...patch,
              updatedAt: nowIso(),
              revision: item.revision + 1,
              completedAt:
                patch.status === "done" ? nowIso() : item.completedAt,
              archivedAt:
                patch.status === "archived" ? nowIso() : item.archivedAt,
              waitingForCurrentUser:
                patch.status === "waiting_for_human" ||
                patch.status === "in_review"
                  ? item.humanAssigneeIds.includes(CURRENT_USER_ID)
                  : patch.status
                    ? false
                    : item.waitingForCurrentUser,
            }
          : item
      ),
    }));
  }, []);

  const acceptIssue = useCallback((issueId: string) => {
    setState((prev) => ({
      ...prev,
      issues: prev.issues.map((item) =>
        item.id === issueId
          ? {
              ...item,
              status: "done" as ProjectIssueStatus,
              waitingForCurrentUser: false,
              latestProgress: "Human 已接受交付",
              completedAt: nowIso(),
              updatedAt: nowIso(),
              revision: item.revision + 1,
            }
          : item
      ),
    }));
  }, []);

  const requestIssueChanges = useCallback(
    (issueId: string, feedback: string) => {
      setState((prev) => ({
        ...prev,
        issues: prev.issues.map((item) =>
          item.id === issueId
            ? {
                ...item,
                status: "changes_requested" as ProjectIssueStatus,
                waitingForCurrentUser: false,
                latestProgress: feedback,
                updatedAt: nowIso(),
                revision: item.revision + 1,
              }
            : item
        ),
      }));
    },
    []
  );

  const cancelIssue = useCallback((issueId: string) => {
    setState((prev) => ({
      ...prev,
      issues: prev.issues.map((item) =>
        item.id === issueId
          ? {
              ...item,
              status: "cancelled" as ProjectIssueStatus,
              waitingForCurrentUser: false,
              updatedAt: nowIso(),
              revision: item.revision + 1,
            }
          : item
      ),
    }));
  }, []);

  const archiveIssue = useCallback((issueId: string) => {
    setState((prev) => ({
      ...prev,
      issues: prev.issues.map((item) =>
        item.id === issueId
          ? {
              ...item,
              status: "archived" as ProjectIssueStatus,
              waitingForCurrentUser: false,
              archivedAt: nowIso(),
              updatedAt: nowIso(),
              revision: item.revision + 1,
            }
          : item
      ),
    }));
  }, []);

  const bindSharedTool = useCallback((payload: BindSharedToolPayload) => {
    setState((prev) => {
      const alreadyBound = prev.sharedToolBindings.some(
        (item) =>
          item.projectId === payload.projectId &&
          item.publishedResourceVersionId === payload.publishedResourceVersionId
      );
      if (alreadyBound) return prev;

      const catalog = prev.publishedTools.find(
        (item) => item.versionId === payload.publishedResourceVersionId
      );
      const kind = catalog?.kind ?? payload.resource?.kind;
      const displayName = catalog?.name ?? payload.resource?.displayName;
      if (!kind || !displayName) return prev;

      const requiresCredential =
        catalog?.requiresCredential ??
        payload.resource?.requiresCredential ??
        kind === "mcp";
      const compatibleActorIds =
        catalog?.compatibleActorIds ??
        payload.resource?.compatibleActorIds ??
        [];

      let publishedTools = prev.publishedTools;
      if (!catalog && payload.resource) {
        publishedTools = [
          ...prev.publishedTools,
          {
            id: payload.publishedResourceVersionId.replace(/-v\d+$/, ""),
            versionId: payload.publishedResourceVersionId,
            kind,
            name: displayName,
            description: payload.resource.description ?? "",
            publisher: "Claw Workbench Catalog",
            version: "1.0.0",
            scenario: "",
            compatibleActorIds,
            requiresCredential,
            available: true,
          },
        ];
      }

      const bindingId = createId("stb");
      const binding: ProjectSharedToolBinding = {
        id: bindingId,
        projectId: payload.projectId,
        publishedResourceVersionId: payload.publishedResourceVersionId,
        kind,
        displayName,
        permission: payload.permission,
        credentialRef: payload.credentialRef,
        compatibleActorIds,
        status: requiresCredential ? "authorization_required" : "active",
        addedByUserId: CURRENT_USER_ID,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      return {
        ...prev,
        publishedTools,
        sharedToolBindings: [...prev.sharedToolBindings, binding],
        projects: prev.projects.map((item) =>
          item.id === payload.projectId
            ? {
                ...item,
                sharedToolBindingIds: [
                  ...(item.sharedToolBindingIds ?? []),
                  bindingId,
                ],
                updatedAt: nowIso(),
              }
            : item
        ),
      };
    });
  }, []);

  const unbindSharedTool = useCallback((bindingId: string) => {
    setState((prev) => {
      const binding = prev.sharedToolBindings.find(
        (item) => item.id === bindingId
      );
      if (!binding) return prev;
      return {
        ...prev,
        sharedToolBindings: prev.sharedToolBindings.filter(
          (item) => item.id !== bindingId
        ),
        projects: prev.projects.map((item) =>
          item.id === binding.projectId
            ? {
                ...item,
                sharedToolBindingIds: item.sharedToolBindingIds.filter(
                  (id) => id !== bindingId
                ),
                updatedAt: nowIso(),
              }
            : item
        ),
      };
    });
  }, []);

  const applyIssueProposal = useCallback((proposalId: string) => {
    setState((prev) => {
      const proposal = prev.issueProposals.find((item) => item.id === proposalId);
      if (!proposal || proposal.dismissed) return prev;
      const snapshot = {
        proposalId,
        issues: structuredClone(prev.issues),
        projects: structuredClone(prev.projects),
      };
      const next = structuredClone(prev);
      next.lastAppliedProposalSnapshot = snapshot;
      next.issueProposals = next.issueProposals.map((item) =>
        item.id === proposalId ? { ...item, dismissed: true } : item
      );

      if (proposal.action === "create") {
        const issueId = createId("issue");
        const project = next.projects.find(
          (item) => item.id === proposal.projectId
        );
        if (!project) return prev;
        const issue: ProjectIssue = {
          id: issueId,
          projectId: proposal.projectId,
          key: `NEW-${next.issues.filter((i) => i.projectId === proposal.projectId).length + 1}`,
          title: proposal.proposedTitle ?? "新事项",
          summary: proposal.proposedSummary ?? "",
          status: proposal.proposedStatus ?? "clarifying",
          relatedMessageIds: proposal.evidenceMessageIds,
          sourceMessageId: proposal.evidenceMessageIds[0],
          humanAssigneeIds: proposal.proposedHumanAssigneeIds ?? [],
          agentAssigneeIds: proposal.proposedAgentAssigneeIds ?? [],
          invocationIds: [],
          artifactIds: [],
          acceptanceCriteria: [],
          createdBy: { kind: "issue_steward", id: "steward" },
          createdAt: nowIso(),
          updatedAt: nowIso(),
          revision: 1,
        };
        next.issues = [issue, ...next.issues];
        next.projects = next.projects.map((item) =>
          item.id === proposal.projectId
            ? {
                ...item,
                issueIds: [...item.issueIds, issueId],
                updatedAt: nowIso(),
              }
            : item
        );
      } else if (
        (proposal.action === "update" ||
          proposal.action === "complete" ||
          proposal.action === "cancel" ||
          proposal.action === "archive") &&
        proposal.targetIssueId
      ) {
        next.issues = next.issues.map((item) => {
          if (item.id !== proposal.targetIssueId) return item;
          let status = item.status;
          if (proposal.proposedStatus) status = proposal.proposedStatus;
          if (proposal.action === "complete") status = "done";
          if (proposal.action === "cancel") status = "cancelled";
          if (proposal.action === "archive") status = "archived";
          return {
            ...item,
            status,
            title: proposal.proposedTitle ?? item.title,
            summary: proposal.proposedSummary ?? item.summary,
            humanAssigneeIds:
              proposal.proposedHumanAssigneeIds ?? item.humanAssigneeIds,
            agentAssigneeIds:
              proposal.proposedAgentAssigneeIds ?? item.agentAssigneeIds,
            updatedAt: nowIso(),
            revision: item.revision + 1,
            completedAt: status === "done" ? nowIso() : item.completedAt,
            archivedAt: status === "archived" ? nowIso() : item.archivedAt,
          };
        });
      } else if (proposal.action === "append" && proposal.targetIssueId) {
        next.issues = next.issues.map((item) =>
          item.id === proposal.targetIssueId
            ? {
                ...item,
                relatedMessageIds: Array.from(
                  new Set([
                    ...item.relatedMessageIds,
                    ...proposal.evidenceMessageIds,
                  ])
                ),
                updatedAt: nowIso(),
                revision: item.revision + 1,
              }
            : item
        );
      }

      return next;
    });
  }, []);

  const dismissIssueProposal = useCallback((proposalId: string) => {
    setState((prev) => ({
      ...prev,
      issueProposals: prev.issueProposals.map((item) =>
        item.id === proposalId ? { ...item, dismissed: true } : item
      ),
    }));
  }, []);

  const undoIssueProposal = useCallback((proposalId: string) => {
    setState((prev) => {
      const snapshot = prev.lastAppliedProposalSnapshot;
      if (!snapshot || snapshot.proposalId !== proposalId) return prev;
      return {
        ...prev,
        issues: snapshot.issues,
        projects: snapshot.projects,
        issueProposals: prev.issueProposals.map((item) =>
          item.id === proposalId ? { ...item, dismissed: false } : item
        ),
        lastAppliedProposalSnapshot: null,
      };
    });
  }, []);

  const value = useMemo<ProjectConversationContextValue>(
    () => ({
      state,
      currentUserId: CURRENT_USER_ID,
      unreadInboxCount,
      getWorkspace,
      getProject,
      getThread,
      getMessages,
      getMembers,
      getUser,
      getActor,
      getInvocation,
      getSession,
      getDelegations,
      getEvents,
      getArtifacts,
      getFiles,
      getWorkSources,
      getIssues,
      getIssue,
      getSharedTools,
      getMyWorkProjection,
      sendMessage,
      cancelInvocation,
      retryInvocation,
      acceptAgentReply,
      requestAgentChanges,
      openDrawer,
      openIssueDrawer,
      closeDrawer,
      openExecution,
      setHighlightedMessage,
      markInboxRead,
      resolvePersonalClawConsent,
      addHumanMember,
      addAgentMember,
      removeMember,
      archiveProject,
      updateProjectBrief,
      restoreActorOnline,
      addGitHubWorkSource,
      addLocalWorkSource,
      removeWorkSource,
      createIssue,
      updateIssue,
      acceptIssue,
      requestIssueChanges,
      cancelIssue,
      archiveIssue,
      bindSharedTool,
      unbindSharedTool,
      applyIssueProposal,
      dismissIssueProposal,
      undoIssueProposal,
    }),
    [
      state,
      unreadInboxCount,
      getWorkspace,
      getProject,
      getThread,
      getMessages,
      getMembers,
      getUser,
      getActor,
      getInvocation,
      getSession,
      getDelegations,
      getEvents,
      getArtifacts,
      getFiles,
      getWorkSources,
      getIssues,
      getIssue,
      getSharedTools,
      getMyWorkProjection,
      sendMessage,
      cancelInvocation,
      retryInvocation,
      acceptAgentReply,
      requestAgentChanges,
      openDrawer,
      openIssueDrawer,
      closeDrawer,
      openExecution,
      setHighlightedMessage,
      markInboxRead,
      resolvePersonalClawConsent,
      addHumanMember,
      addAgentMember,
      removeMember,
      archiveProject,
      updateProjectBrief,
      restoreActorOnline,
      addGitHubWorkSource,
      addLocalWorkSource,
      removeWorkSource,
      createIssue,
      updateIssue,
      acceptIssue,
      requestIssueChanges,
      cancelIssue,
      archiveIssue,
      bindSharedTool,
      unbindSharedTool,
      applyIssueProposal,
      dismissIssueProposal,
      undoIssueProposal,
    ]
  );


  return (
    <ProjectConversationContext.Provider value={value}>
      {children}
    </ProjectConversationContext.Provider>
  );
}

export function useProjectConversation() {
  const ctx = useContext(ProjectConversationContext);
  if (!ctx) {
    throw new Error(
      "useProjectConversation must be used within ProjectConversationProvider"
    );
  }
  return ctx;
}
