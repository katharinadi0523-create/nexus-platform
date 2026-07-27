"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import {
  ACTOR_TYPE_LABELS,
  CURRENT_USER_ID,
  createCollaborationSeedState,
  type ActivityKind,
  type AgentActor,
  type CollaborationProject,
  type CollaborationSeedState,
  type CollaborationUser,
  type ExecutorRef,
  type InboxItem,
  type Issue,
  type IssueComment,
  type IssuePriority,
  type IssueStatus,
  type ProjectActivityItem,
  type ProjectArtifact,
  type ProjectWorkSourceBinding,
  type ProjectWorkingFile,
  type Run,
  type RunStatus,
  type Squad,
  type SquadAgentMember,
  type WorkSourceAvailability,
  type WorkspaceCatalogResource,
} from "@/lib/mock/my-claw/collaboration";

type CollaborationState = CollaborationSeedState;

type CollaborationAction =
  | {
      type: "create_project";
      payload: {
        id?: string;
        workspaceId: string;
        name: string;
        description: string;
        leadUserId: string;
        memberIds: string[];
        actorIds: string[];
        contextBrief?: string;
      };
    }
  | {
      type: "update_project_brief";
      payload: { projectId: string; contextBrief: string };
    }
  | {
      type: "bind_project_resource";
      payload: {
        workspaceId: string;
        projectId: string;
        type: ProjectWorkSourceBinding["type"];
        name: string;
        locator: string;
        branch?: string;
        access: ProjectWorkSourceBinding["access"];
        availability: WorkSourceAvailability;
      };
    }
  | { type: "unbind_project_resource"; payload: { bindingId: string } }
  | {
      type: "add_working_file";
      payload: {
        workspaceId: string;
        projectId: string;
        name: string;
      };
    }
  | { type: "delete_working_file"; payload: { fileId: string } }
  | {
      type: "create_issue";
      payload: {
        id?: string;
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
      };
    }
  | {
      type: "update_issue_status";
      payload: { issueId: string; status: IssueStatus };
    }
  | {
      type: "assign_issue";
      payload: {
        issueId: string;
        ownerUserId?: string;
        executor?: ExecutorRef | null;
        reviewerUserId?: string | null;
        priority?: IssuePriority;
      };
    }
  | {
      type: "add_comment";
      payload: {
        issueId: string;
        content: string;
        mentionedActorIds: string[];
        mentionedSquadIds: string[];
      };
    }
  | { type: "advance_run"; payload: { runId: string } }
  | { type: "rerun"; payload: { runId: string } }
  | { type: "cancel_run"; payload: { runId: string } }
  | { type: "approve_issue"; payload: { issueId: string } }
  | {
      type: "reject_issue";
      payload: { issueId: string; reason: string };
    }
  | {
      type: "create_squad";
      payload: {
        id?: string;
        workspaceId: string;
        projectId: string;
        name: string;
        description: string;
        leaderActorId: string;
        agentMembers: SquadAgentMember[];
      };
    }
  | {
      type: "update_squad";
      payload: {
        squadId: string;
        description?: string;
        leaderActorId?: string;
        agentMembers?: SquadAgentMember[];
      };
    }
  | {
      type: "accept_squad_invitation";
      payload: { inboxId: string; actorId?: string; squadId?: string };
    }
  | { type: "mark_inbox_read"; payload: { inboxId: string } }
  | { type: "mark_all_inbox_read" };

function nowIso() {
  return "2026-07-27T02:00:00+08:00";
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function nextIssueKey(issues: Issue[], projectId: string): string {
  const projectIssues = issues.filter((issue) => issue.projectId === projectId);
  const prefix =
    projectId === "proj-kb20" ? "KB" : projectId === "proj-research-auto" ? "RS" : "AGE";
  const max = projectIssues.reduce((acc, issue) => {
    const num = Number(issue.key.split("-")[1] ?? "0");
    return Number.isFinite(num) ? Math.max(acc, num) : acc;
  }, 0);
  return `${prefix}-${max + 1}`;
}

function pushActivity(
  state: CollaborationState,
  item: Omit<ProjectActivityItem, "id" | "createdAt"> & { createdAt?: string }
): ProjectActivityItem[] {
  return [
    {
      id: uid("act"),
      createdAt: item.createdAt ?? nowIso(),
      ...item,
    },
    ...state.activities,
  ];
}

function createQueuedRun(params: {
  workspaceId: string;
  projectId: string;
  issueId: string;
  executor: ExecutorRef;
  triggerType: Run["triggerType"];
  summary: string;
  childRuns?: Run["childRuns"];
}): Run {
  return {
    id: uid("run"),
    workspaceId: params.workspaceId,
    projectId: params.projectId,
    issueId: params.issueId,
    executor: params.executor,
    status: "queued",
    triggerType: params.triggerType,
    summary: params.summary,
    childRuns: params.childRuns,
    events: [
      {
        id: uid("evt"),
        index: 1,
        type: "agent",
        content: "Run queued. Waiting to start execution...",
        timestamp: nowIso(),
      },
    ],
  };
}

function buildSquadChildRuns(squad: Squad, actors: AgentActor[]): Run["childRuns"] {
  const activeMembers = squad.agentMembers.filter(
    (member) =>
      member.state === "active" &&
      member.actorId !== squad.leaderActorId &&
      actors.find((actor) => actor.id === member.actorId)?.runtimeStatus !== "offline"
  );
  const picked = activeMembers.slice(0, 2);
  return [
    {
      actorId: squad.leaderActorId,
      status: "queued",
      summary: "Leader 准备拆分任务。",
    },
    ...picked.map((member) => ({
      actorId: member.actorId,
      status: "queued" as RunStatus,
      summary: `分配给 ${actors.find((a) => a.id === member.actorId)?.name ?? member.actorId}`,
    })),
  ];
}

function computeSquadStatus(
  agentMembers: SquadAgentMember[],
  actors: AgentActor[]
): Squad["status"] {
  const hasPending = agentMembers.some(
    (member) => member.state === "pending_consent"
  );
  if (hasPending) return "degraded";

  const hasPendingPersonalClaw = agentMembers.some((member) => {
    if (member.state !== "pending_consent") return false;
    const actor = actors.find((item) => item.id === member.actorId);
    return actor?.type === "personal_claw";
  });
  if (hasPendingPersonalClaw) return "degraded";

  const activeCount = agentMembers.filter(
    (member) => member.state === "active"
  ).length;
  if (activeCount < 2) return "degraded";
  return "ready";
}

export function validateSquadComposition(
  agentMembers: SquadAgentMember[],
  actors: AgentActor[]
): { ok: boolean; message: string } {
  const agentCount = agentMembers.length;
  const humanCount = agentMembers.filter((member) => {
    const actor = actors.find((item) => item.id === member.actorId);
    return actor?.type === "personal_claw";
  }).length;
  const nonPersonalAgentCount = agentMembers.filter((member) => {
    const actor = actors.find((item) => item.id === member.actorId);
    return actor && actor.type !== "personal_claw";
  }).length;

  if (agentCount <= humanCount || nonPersonalAgentCount < 1) {
    return {
      ok: false,
      message:
        "小队组成不合法：Agent 数量须大于 Human 数量，且至少包含一个平台 Claw 或多智能体组",
    };
  }
  return { ok: true, message: "" };
}

function deriveHumanMembers(
  squad: Pick<Squad, "agentMembers">,
  actors: AgentActor[],
  users: CollaborationUser[]
): CollaborationUser[] {
  const humans: CollaborationUser[] = [];
  const seen = new Set<string>();
  for (const member of squad.agentMembers) {
    const actor = actors.find((item) => item.id === member.actorId);
    if (!actor || actor.type !== "personal_claw" || !actor.ownerUserId) continue;
    if (seen.has(actor.ownerUserId)) continue;
    const user = users.find((item) => item.id === actor.ownerUserId);
    if (user) {
      seen.add(user.id);
      humans.push(user);
    }
  }
  return humans;
}

function collaborationReducer(
  state: CollaborationState,
  action: CollaborationAction
): CollaborationState {
  switch (action.type) {
    case "create_project": {
      const id = action.payload.id ?? uid("proj");
      const project: CollaborationProject = {
        id,
        workspaceId: action.payload.workspaceId,
        name: action.payload.name,
        description: action.payload.description,
        status: "active",
        leadUserId: action.payload.leadUserId,
        memberIds: action.payload.memberIds,
        actorIds: action.payload.actorIds,
        squadIds: [],
        contextBrief: action.payload.contextBrief ?? "",
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      return {
        ...state,
        projects: [project, ...state.projects],
        workspaces: state.workspaces.map((workspace) =>
          workspace.id === action.payload.workspaceId
            ? { ...workspace, projectCount: workspace.projectCount + 1 }
            : workspace
        ),
        activities: pushActivity(state, {
          projectId: id,
          workspaceId: action.payload.workspaceId,
          kind: "project",
          title: "创建项目",
          summary: `创建协作项目「${project.name}」。`,
          actorLabel: "若楠",
        }),
      };
    }
    case "update_project_brief": {
      return {
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.payload.projectId
            ? {
                ...project,
                contextBrief: action.payload.contextBrief,
                updatedAt: nowIso(),
              }
            : project
        ),
        activities: (() => {
          const project = state.projects.find((p) => p.id === action.payload.projectId);
          if (!project) return state.activities;
          return pushActivity(state, {
            projectId: project.id,
            workspaceId: project.workspaceId,
            kind: "context",
            title: "更新项目 Brief",
            summary: "项目目标与协作规则已更新。",
            actorLabel: "若楠",
          });
        })(),
      };
    }
    case "bind_project_resource": {
      const binding: ProjectWorkSourceBinding = {
        id: uid("bind"),
        workspaceId: action.payload.workspaceId,
        projectId: action.payload.projectId,
        type: action.payload.type,
        name: action.payload.name,
        locator: action.payload.locator,
        branch: action.payload.branch,
        access: action.payload.access,
        availability: action.payload.availability,
        validatedAt:
          action.payload.availability === "available" ? nowIso() : undefined,
        boundAt: nowIso(),
      };
      return {
        ...state,
        resourceBindings: [binding, ...state.resourceBindings],
        activities: pushActivity(state, {
          projectId: action.payload.projectId,
          workspaceId: action.payload.workspaceId,
          kind: "context",
          title: "绑定工作源",
          summary: `绑定「${action.payload.name}」。`,
          actorLabel: "若楠",
        }),
      };
    }
    case "unbind_project_resource":
      return {
        ...state,
        resourceBindings: state.resourceBindings.filter(
          (binding) => binding.id !== action.payload.bindingId
        ),
      };
    case "add_working_file": {
      const file: ProjectWorkingFile = {
        id: uid("file"),
        workspaceId: action.payload.workspaceId,
        projectId: action.payload.projectId,
        name: action.payload.name,
        path: `/projects/${action.payload.projectId}/files/${action.payload.name}`,
        sizeLabel: "8 KB",
        updatedByLabel: "若楠",
        updatedAt: nowIso(),
      };
      return {
        ...state,
        workingFiles: [file, ...state.workingFiles],
        activities: pushActivity(state, {
          projectId: action.payload.projectId,
          workspaceId: action.payload.workspaceId,
          kind: "context",
          title: "上传工作文件",
          summary: `新增文件「${file.name}」。`,
          actorLabel: "若楠",
        }),
      };
    }
    case "delete_working_file":
      return {
        ...state,
        workingFiles: state.workingFiles.filter(
          (file) => file.id !== action.payload.fileId
        ),
      };
    case "create_issue": {
      const issueId = action.payload.id ?? uid("issue");
      const key = nextIssueKey(state.issues, action.payload.projectId);
      const executor = action.payload.executor;
      const shouldCreateRun =
        executor?.kind === "agent" || executor?.kind === "squad";
      let run: Run | null = null;
      if (shouldCreateRun && executor) {
        if (executor.kind === "squad") {
          const squad = state.squads.find((item) => item.id === executor.id);
          run = createQueuedRun({
            workspaceId: action.payload.workspaceId,
            projectId: action.payload.projectId,
            issueId,
            executor,
            triggerType: "assignment",
            summary: `指派给小队，等待执行。`,
            childRuns: squad
              ? buildSquadChildRuns(squad, state.actors)
              : undefined,
          });
        } else {
          run = createQueuedRun({
            workspaceId: action.payload.workspaceId,
            projectId: action.payload.projectId,
            issueId,
            executor,
            triggerType: "assignment",
            summary: "指派给 Agent，等待执行。",
          });
        }
      }
      const status: IssueStatus = shouldCreateRun
        ? "in_progress"
        : action.payload.status;
      const issue: Issue = {
        id: issueId,
        key,
        workspaceId: action.payload.workspaceId,
        projectId: action.payload.projectId,
        title: action.payload.title,
        description: action.payload.description,
        acceptanceCriteria: action.payload.acceptanceCriteria,
        status,
        priority: action.payload.priority,
        ownerUserId: action.payload.ownerUserId,
        executor,
        reviewerUserId: action.payload.reviewerUserId,
        commentIds: [],
        runIds: run ? [run.id] : [],
        artifactIds: [],
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      const systemComment: IssueComment = {
        id: uid("comment"),
        issueId,
        author: { kind: "system", id: "system" },
        content: `若楠 created this issue${run ? " and queued a run" : ""}`,
        mentionedActorIds: [],
        createdAt: nowIso(),
      };
      issue.commentIds = [systemComment.id];
      return {
        ...state,
        issues: [issue, ...state.issues],
        runs: run ? [run, ...state.runs] : state.runs,
        comments: [systemComment, ...state.comments],
        activities: pushActivity(state, {
          projectId: action.payload.projectId,
          workspaceId: action.payload.workspaceId,
          kind: "issue",
          title: "创建 Issue",
          summary: `创建 ${key}「${issue.title}」。`,
          actorLabel: "若楠",
          issueId,
        }),
      };
    }
    case "update_issue_status": {
      const issue = state.issues.find((item) => item.id === action.payload.issueId);
      if (!issue) return state;
      const comment: IssueComment = {
        id: uid("comment"),
        issueId: issue.id,
        author: { kind: "system", id: "system" },
        content: `status changed to ${action.payload.status}`,
        mentionedActorIds: [],
        createdAt: nowIso(),
      };
      return {
        ...state,
        issues: state.issues.map((item) =>
          item.id === issue.id
            ? {
                ...item,
                status: action.payload.status,
                updatedAt: nowIso(),
                commentIds: [comment.id, ...item.commentIds],
              }
            : item
        ),
        comments: [comment, ...state.comments],
      };
    }
    case "assign_issue": {
      const issue = state.issues.find((item) => item.id === action.payload.issueId);
      if (!issue) return state;
      const nextExecutor =
        action.payload.executor !== undefined
          ? action.payload.executor
          : issue.executor;
      let runs = state.runs;
      let runIds = issue.runIds;
      let status = issue.status;
      let comments = state.comments;
      let commentIds = issue.commentIds;

      if (
        action.payload.executor &&
        (action.payload.executor.kind === "agent" ||
          action.payload.executor.kind === "squad")
      ) {
        const executor = action.payload.executor;
        const squad =
          executor.kind === "squad"
            ? state.squads.find((item) => item.id === executor.id)
            : undefined;
        const run = createQueuedRun({
          workspaceId: issue.workspaceId,
          projectId: issue.projectId,
          issueId: issue.id,
          executor,
          triggerType: "assignment",
          summary: "重新指派后创建执行。",
          childRuns: squad
            ? buildSquadChildRuns(squad, state.actors)
            : undefined,
        });
        runs = [run, ...runs];
        runIds = [run.id, ...runIds];
        status = "in_progress";
        const comment: IssueComment = {
          id: uid("comment"),
          issueId: issue.id,
          author: { kind: "system", id: "system" },
          content: "executor changed and a new run was queued",
          mentionedActorIds: [],
          createdAt: nowIso(),
        };
        comments = [comment, ...comments];
        commentIds = [comment.id, ...commentIds];
      }

      return {
        ...state,
        runs,
        comments,
        issues: state.issues.map((item) =>
          item.id === issue.id
            ? {
                ...item,
                ownerUserId: action.payload.ownerUserId ?? item.ownerUserId,
                reviewerUserId:
                  action.payload.reviewerUserId !== undefined
                    ? action.payload.reviewerUserId
                    : item.reviewerUserId,
                priority: action.payload.priority ?? item.priority,
                executor: nextExecutor,
                status,
                runIds,
                commentIds,
                updatedAt: nowIso(),
              }
            : item
        ),
      };
    }
    case "add_comment": {
      const issue = state.issues.find((item) => item.id === action.payload.issueId);
      if (!issue) return state;
      const mentionedActorIds = action.payload.mentionedActorIds;
      const mentionedSquadIds = action.payload.mentionedSquadIds;
      const comment: IssueComment = {
        id: uid("comment"),
        issueId: issue.id,
        author: { kind: "human", id: CURRENT_USER_ID },
        content: action.payload.content,
        mentionedActorIds,
        createdAt: nowIso(),
      };
      let runs = state.runs;
      let runIds = issue.runIds;
      const triggerTargets: ExecutorRef[] = [
        ...mentionedActorIds.map((id) => ({ kind: "agent" as const, id })),
        ...mentionedSquadIds.map((id) => ({ kind: "squad" as const, id })),
      ];
      for (const executor of triggerTargets) {
        const squad =
          executor.kind === "squad"
            ? state.squads.find((item) => item.id === executor.id)
            : undefined;
        const run = createQueuedRun({
          workspaceId: issue.workspaceId,
          projectId: issue.projectId,
          issueId: issue.id,
          executor,
          triggerType: "mention",
          summary: "由评论 @mention 触发执行。",
          childRuns: squad
            ? buildSquadChildRuns(squad, state.actors)
            : undefined,
        });
        comment.runId = run.id;
        runs = [run, ...runs];
        runIds = [run.id, ...runIds];
      }
      return {
        ...state,
        comments: [comment, ...state.comments],
        runs,
        issues: state.issues.map((item) =>
          item.id === issue.id
            ? {
                ...item,
                commentIds: [comment.id, ...item.commentIds],
                runIds,
                updatedAt: nowIso(),
              }
            : item
        ),
        activities: pushActivity(state, {
          projectId: issue.projectId,
          workspaceId: issue.workspaceId,
          kind: "comment",
          title: "新增评论",
          summary: action.payload.content.slice(0, 80),
          actorLabel: "若楠",
          issueId: issue.id,
        }),
      };
    }
    case "advance_run": {
      const run = state.runs.find((item) => item.id === action.payload.runId);
      if (!run) return state;
      let nextStatus: RunStatus = run.status;
      if (run.status === "queued") nextStatus = "running";
      else if (run.status === "running") nextStatus = "completed";
      else return state;

      const updatedRun: Run = {
        ...run,
        status: nextStatus,
        startedAt: run.startedAt ?? nowIso(),
        completedAt: nextStatus === "completed" ? nowIso() : run.completedAt,
        summary:
          nextStatus === "running"
            ? "执行中…"
            : nextStatus === "completed"
              ? "执行完成，等待业务验收。"
              : run.summary,
        childRuns: run.childRuns?.map((child) => ({
          ...child,
          status: nextStatus,
        })),
        events: [
          ...(run.events ?? []),
          {
            id: uid("evt"),
            index: (run.events?.length ?? 0) + 1,
            type: "agent",
            content:
              nextStatus === "running"
                ? "Run advanced to running."
                : "Run completed successfully.",
            timestamp: nowIso(),
          },
        ],
      };

      let issues = state.issues;
      let comments = state.comments;
      let activities = state.activities;
      if (nextStatus === "completed") {
        const issue = state.issues.find((item) => item.id === run.issueId);
        if (issue && issue.status === "in_progress") {
          const comment: IssueComment = {
            id: uid("comment"),
            issueId: issue.id,
            author: { kind: "system", id: "system" },
            content: "Run completed · Issue moved to In Review",
            mentionedActorIds: [],
            createdAt: nowIso(),
          };
          comments = [comment, ...comments];
          issues = issues.map((item) =>
            item.id === issue.id
              ? {
                  ...item,
                  status: "in_review",
                  updatedAt: nowIso(),
                  commentIds: [comment.id, ...item.commentIds],
                }
              : item
          );
          activities = pushActivity(
            { ...state, activities },
            {
              projectId: issue.projectId,
              workspaceId: issue.workspaceId,
              kind: "run",
              title: "Run 完成",
              summary: `${issue.key} 进入 In Review。`,
              actorLabel: "系统",
              issueId: issue.id,
              runId: run.id,
            }
          );
        }
      }

      return {
        ...state,
        runs: state.runs.map((item) => (item.id === run.id ? updatedRun : item)),
        issues,
        comments,
        activities,
        squads: state.squads.map((squad) => {
          if (run.executor.kind !== "squad" || run.executor.id !== squad.id) {
            return squad;
          }
          return {
            ...squad,
            status:
              nextStatus === "running"
                ? "running"
                : computeSquadStatus(squad.agentMembers, state.actors),
            updatedAt: nowIso(),
          };
        }),
      };
    }
    case "rerun": {
      const run = state.runs.find((item) => item.id === action.payload.runId);
      if (!run) return state;
      const issue = state.issues.find((item) => item.id === run.issueId);
      if (!issue) return state;
      const squad =
        run.executor.kind === "squad"
          ? state.squads.find((item) => item.id === run.executor.id)
          : undefined;
      const next = createQueuedRun({
        workspaceId: run.workspaceId,
        projectId: run.projectId,
        issueId: run.issueId,
        executor: run.executor,
        triggerType: "rerun",
        summary: "重跑已创建。",
        childRuns: squad ? buildSquadChildRuns(squad, state.actors) : run.childRuns,
      });
      const comment: IssueComment = {
        id: uid("comment"),
        issueId: issue.id,
        author: { kind: "system", id: "system" },
        content: "A rerun was queued",
        mentionedActorIds: [],
        createdAt: nowIso(),
      };
      return {
        ...state,
        runs: [next, ...state.runs],
        comments: [comment, ...state.comments],
        issues: state.issues.map((item) =>
          item.id === issue.id
            ? {
                ...item,
                status: "in_progress",
                runIds: [next.id, ...item.runIds],
                commentIds: [comment.id, ...item.commentIds],
                updatedAt: nowIso(),
              }
            : item
        ),
      };
    }
    case "cancel_run": {
      return {
        ...state,
        runs: state.runs.map((run) =>
          run.id === action.payload.runId && run.status === "running"
            ? {
                ...run,
                status: "cancelled",
                completedAt: nowIso(),
                summary: "执行已取消。",
              }
            : run
        ),
      };
    }
    case "approve_issue": {
      const issue = state.issues.find((item) => item.id === action.payload.issueId);
      if (!issue) return state;
      const comment: IssueComment = {
        id: uid("comment"),
        issueId: issue.id,
        author: { kind: "system", id: "system" },
        content: "Review approved · status changed to Done",
        mentionedActorIds: [],
        createdAt: nowIso(),
      };
      return {
        ...state,
        comments: [comment, ...state.comments],
        issues: state.issues.map((item) =>
          item.id === issue.id
            ? {
                ...item,
                status: "done",
                updatedAt: nowIso(),
                commentIds: [comment.id, ...item.commentIds],
              }
            : item
        ),
        activities: pushActivity(state, {
          projectId: issue.projectId,
          workspaceId: issue.workspaceId,
          kind: "issue",
          title: "验收通过",
          summary: `${issue.key} 已完成。`,
          actorLabel: "若楠",
          issueId: issue.id,
        }),
      };
    }
    case "reject_issue": {
      const issue = state.issues.find((item) => item.id === action.payload.issueId);
      if (!issue) return state;
      const systemComment: IssueComment = {
        id: uid("comment"),
        issueId: issue.id,
        author: { kind: "system", id: "system" },
        content: "Review rejected · status changed to In Progress",
        mentionedActorIds: [],
        createdAt: nowIso(),
      };
      const humanComment: IssueComment = {
        id: uid("comment"),
        issueId: issue.id,
        author: { kind: "human", id: CURRENT_USER_ID },
        content: `驳回原因：${action.payload.reason}`,
        mentionedActorIds: [],
        createdAt: nowIso(),
      };
      return {
        ...state,
        comments: [humanComment, systemComment, ...state.comments],
        issues: state.issues.map((item) =>
          item.id === issue.id
            ? {
                ...item,
                status: "in_progress",
                updatedAt: nowIso(),
                commentIds: [humanComment.id, systemComment.id, ...item.commentIds],
              }
            : item
        ),
      };
    }
    case "create_squad": {
      const id = action.payload.id ?? uid("squad");
      const agentMembers = action.payload.agentMembers;
      const composition = validateSquadComposition(agentMembers, state.actors);
      if (!composition.ok) return state;
      const squad: Squad = {
        id,
        workspaceId: action.payload.workspaceId,
        projectId: action.payload.projectId,
        name: action.payload.name,
        description: action.payload.description,
        leaderActorId: action.payload.leaderActorId,
        agentMembers,
        status: computeSquadStatus(agentMembers, state.actors),
        activeIssueCount: 0,
        updatedAt: nowIso(),
      };
      const pendingActors = agentMembers.filter(
        (member) => member.state === "pending_consent"
      );
      const inboxItems: InboxItem[] = pendingActors.map((member) => {
        const actor = state.actors.find((item) => item.id === member.actorId);
        const project = state.projects.find(
          (item) => item.id === action.payload.projectId
        );
        const workspace = state.workspaces.find(
          (item) => item.id === action.payload.workspaceId
        );
        return {
          id: uid("inbox"),
          userId: actor?.ownerUserId ?? CURRENT_USER_ID,
          type: "personal_claw_consent",
          title: `个人 Claw 入队确认：${actor?.name ?? member.actorId}`,
          summary: `「${squad.name}」邀请加入，需所属用户确认。`,
          unread: true,
          source: {
            kind: "project",
            workspaceId: action.payload.workspaceId,
            workspaceName: workspace?.name ?? "",
            projectId: action.payload.projectId,
            projectName: project?.name ?? "",
          },
          createdAt: nowIso(),
        };
      });
      return {
        ...state,
        squads: [squad, ...state.squads],
        projects: state.projects.map((project) =>
          project.id === action.payload.projectId
            ? {
                ...project,
                squadIds: [id, ...project.squadIds],
                updatedAt: nowIso(),
              }
            : project
        ),
        inboxItems: [...inboxItems, ...state.inboxItems],
        activities: pushActivity(state, {
          projectId: action.payload.projectId,
          workspaceId: action.payload.workspaceId,
          kind: "squad",
          title: "创建小队",
          summary: `创建 Squad「${squad.name}」。`,
          actorLabel: "若楠",
          squadId: id,
        }),
      };
    }
    case "update_squad": {
      return {
        ...state,
        squads: state.squads.map((squad) => {
          if (squad.id !== action.payload.squadId) return squad;
          const agentMembers =
            action.payload.agentMembers ?? squad.agentMembers;
          const composition = validateSquadComposition(
            agentMembers,
            state.actors
          );
          if (!composition.ok) return squad;
          return {
            ...squad,
            description: action.payload.description ?? squad.description,
            leaderActorId: action.payload.leaderActorId ?? squad.leaderActorId,
            agentMembers,
            status:
              squad.status === "running"
                ? "running"
                : computeSquadStatus(agentMembers, state.actors),
            updatedAt: nowIso(),
          };
        }),
      };
    }
    case "accept_squad_invitation": {
      const inbox = state.inboxItems.find(
        (item) => item.id === action.payload.inboxId
      );
      let squads = state.squads;
      if (action.payload.squadId && action.payload.actorId) {
        squads = state.squads.map((squad) => {
          if (squad.id !== action.payload.squadId) return squad;
          const agentMembers = squad.agentMembers.map((member) =>
            member.actorId === action.payload.actorId
              ? { ...member, state: "active" as const }
              : member
          );
          return {
            ...squad,
            agentMembers,
            status:
              squad.status === "running"
                ? "running"
                : computeSquadStatus(agentMembers, state.actors),
            updatedAt: nowIso(),
          };
        });
      } else {
        // Demo path: activate first pending personal claw in research squad
        squads = state.squads.map((squad) => {
          if (squad.id !== "squad-research-delivery") return squad;
          const agentMembers = squad.agentMembers.map((member) =>
            member.state === "pending_consent"
              ? { ...member, state: "active" as const }
              : member
          );
          return {
            ...squad,
            agentMembers,
            status: computeSquadStatus(agentMembers, state.actors),
            updatedAt: nowIso(),
          };
        });
      }
      return {
        ...state,
        squads,
        inboxItems: state.inboxItems.map((item) =>
          item.id === action.payload.inboxId || item.id === inbox?.id
            ? { ...item, unread: false }
            : item
        ),
      };
    }
    case "mark_inbox_read":
      return {
        ...state,
        inboxItems: state.inboxItems.map((item) =>
          item.id === action.payload.inboxId ? { ...item, unread: false } : item
        ),
      };
    case "mark_all_inbox_read":
      return {
        ...state,
        inboxItems: state.inboxItems.map((item) => ({ ...item, unread: false })),
      };
    default:
      return state;
  }
}

interface CollaborationContextValue {
  state: CollaborationState;
  currentUserId: string;
  unreadInboxCount: number;
  getWorkspace: (workspaceId: string) => CollaborationState["workspaces"][number] | undefined;
  getProject: (projectId: string) => CollaborationProject | undefined;
  getIssue: (issueId: string) => Issue | undefined;
  getSquad: (squadId: string) => Squad | undefined;
  getActor: (actorId: string) => AgentActor | undefined;
  getUser: (userId: string) => CollaborationState["users"][number] | undefined;
  getRunsForIssue: (issueId: string) => Run[];
  getLatestRun: (issueId: string) => Run | undefined;
  getCommentsForIssue: (issueId: string) => IssueComment[];
  getArtifactsForProject: (projectId: string) => ProjectArtifact[];
  getBindingsForProject: (projectId: string) => ProjectWorkSourceBinding[];
  getFilesForProject: (projectId: string) => ProjectWorkingFile[];
  getActivitiesForProject: (
    projectId: string,
    kind?: ActivityKind | "all"
  ) => ProjectActivityItem[];
  getCatalogForWorkspace: (workspaceId: string) => WorkspaceCatalogResource[];
  getProjectsForWorkspace: (workspaceId: string) => CollaborationProject[];
  getRecentProjects: (limit?: number) => CollaborationProject[];
  getPersonalClawForUser: (userId: string) => AgentActor | undefined;
  getHumanForPersonalClaw: (actorId: string) => CollaborationUser | undefined;
  getDerivedHumanMembers: (squad: Squad) => CollaborationUser[];
  validateSquadComposition: (
    agentMembers: SquadAgentMember[]
  ) => { ok: boolean; message: string };
  executorLabel: (executor: ExecutorRef | null) => string;
  createProject: (
    payload: Extract<CollaborationAction, { type: "create_project" }>["payload"]
  ) => string;
  updateProjectBrief: (projectId: string, contextBrief: string) => void;
  bindProjectResource: (
    payload: Extract<CollaborationAction, { type: "bind_project_resource" }>["payload"]
  ) => void;
  unbindProjectResource: (bindingId: string) => void;
  addWorkingFile: (
    payload: Extract<CollaborationAction, { type: "add_working_file" }>["payload"]
  ) => void;
  deleteWorkingFile: (fileId: string) => void;
  createIssue: (
    payload: Extract<CollaborationAction, { type: "create_issue" }>["payload"]
  ) => string;
  updateIssueStatus: (issueId: string, status: IssueStatus) => void;
  assignIssue: (
    payload: Extract<CollaborationAction, { type: "assign_issue" }>["payload"]
  ) => void;
  addComment: (
    payload: Extract<CollaborationAction, { type: "add_comment" }>["payload"]
  ) => void;
  advanceRun: (runId: string) => void;
  rerun: (runId: string) => void;
  cancelRun: (runId: string) => void;
  approveIssue: (issueId: string) => void;
  rejectIssue: (issueId: string, reason: string) => void;
  createSquad: (
    payload: Extract<CollaborationAction, { type: "create_squad" }>["payload"]
  ) => string | null;
  updateSquad: (
    payload: Extract<CollaborationAction, { type: "update_squad" }>["payload"]
  ) => boolean;
  acceptSquadInvitation: (payload: {
    inboxId: string;
    actorId?: string;
    squadId?: string;
  }) => void;
  markInboxRead: (inboxId: string) => void;
  markAllInboxRead: () => void;
}

const CollaborationContext = createContext<CollaborationContextValue | null>(
  null
);

export function CollaborationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    collaborationReducer,
    undefined,
    createCollaborationSeedState
  );

  const getWorkspace = useCallback(
    (workspaceId: string) =>
      state.workspaces.find((workspace) => workspace.id === workspaceId),
    [state.workspaces]
  );
  const getProject = useCallback(
    (projectId: string) =>
      state.projects.find((project) => project.id === projectId),
    [state.projects]
  );
  const getIssue = useCallback(
    (issueId: string) => state.issues.find((issue) => issue.id === issueId),
    [state.issues]
  );
  const getSquad = useCallback(
    (squadId: string) => state.squads.find((squad) => squad.id === squadId),
    [state.squads]
  );
  const getActor = useCallback(
    (actorId: string) => state.actors.find((actor) => actor.id === actorId),
    [state.actors]
  );
  const getUser = useCallback(
    (userId: string) => state.users.find((user) => user.id === userId),
    [state.users]
  );
  const getRunsForIssue = useCallback(
    (issueId: string) => {
      const issue = state.issues.find((item) => item.id === issueId);
      if (!issue) return [];
      const ordered = issue.runIds
        .map((id) => state.runs.find((run) => run.id === id))
        .filter((run): run is Run => Boolean(run));
      if (ordered.length > 0) return ordered;
      return state.runs.filter((run) => run.issueId === issueId);
    },
    [state.issues, state.runs]
  );
  const getLatestRun = useCallback(
    (issueId: string) => getRunsForIssue(issueId)[0],
    [getRunsForIssue]
  );
  const getCommentsForIssue = useCallback(
    (issueId: string) => {
      const issue = getIssue(issueId);
      if (!issue) return [];
      return issue.commentIds
        .map((id) => state.comments.find((comment) => comment.id === id))
        .filter(Boolean) as IssueComment[];
    },
    [getIssue, state.comments]
  );
  const getArtifactsForProject = useCallback(
    (projectId: string) =>
      state.artifacts.filter((artifact) => artifact.projectId === projectId),
    [state.artifacts]
  );
  const getBindingsForProject = useCallback(
    (projectId: string) =>
      state.resourceBindings.filter((binding) => binding.projectId === projectId),
    [state.resourceBindings]
  );
  const getFilesForProject = useCallback(
    (projectId: string) =>
      state.workingFiles.filter((file) => file.projectId === projectId),
    [state.workingFiles]
  );
  const getActivitiesForProject = useCallback(
    (projectId: string, kind: ActivityKind | "all" = "all") =>
      state.activities.filter(
        (activity) =>
          activity.projectId === projectId &&
          (kind === "all" || activity.kind === kind)
      ),
    [state.activities]
  );
  const getCatalogForWorkspace = useCallback(
    (workspaceId: string) =>
      state.catalogResources.filter(
        (resource) => resource.workspaceId === workspaceId
      ),
    [state.catalogResources]
  );
  const getProjectsForWorkspace = useCallback(
    (workspaceId: string) =>
      state.projects.filter((project) => project.workspaceId === workspaceId),
    [state.projects]
  );
  const getRecentProjects = useCallback(
    (limit = 5) =>
      [...state.projects]
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        .slice(0, limit),
    [state.projects]
  );

  const getPersonalClawForUserFn = useCallback(
    (userId: string) =>
      state.actors.find(
        (actor) =>
          actor.type === "personal_claw" && actor.ownerUserId === userId
      ),
    [state.actors]
  );

  const getHumanForPersonalClawFn = useCallback(
    (actorId: string) => {
      const actor = state.actors.find((item) => item.id === actorId);
      if (!actor || actor.type !== "personal_claw" || !actor.ownerUserId) {
        return undefined;
      }
      return state.users.find((user) => user.id === actor.ownerUserId);
    },
    [state.actors, state.users]
  );

  const getDerivedHumanMembersFn = useCallback(
    (squad: Squad) => deriveHumanMembers(squad, state.actors, state.users),
    [state.actors, state.users]
  );

  const validateSquadCompositionFn = useCallback(
    (agentMembers: SquadAgentMember[]) =>
      validateSquadComposition(agentMembers, state.actors),
    [state.actors]
  );

  const executorLabel = useCallback(
    (executor: ExecutorRef | null) => {
      if (!executor) return "未指派";
      if (executor.kind === "human") {
        return getUser(executor.id)?.name ?? "成员";
      }
      if (executor.kind === "squad") {
        return getSquad(executor.id)?.name ?? "小队";
      }
      const actor = getActor(executor.id);
      if (!actor) return "Agent";
      return `${actor.name}`;
    },
    [getActor, getSquad, getUser]
  );

  const value = useMemo<CollaborationContextValue>(() => {
    const unreadInboxCount = state.inboxItems.filter(
      (item) => item.userId === CURRENT_USER_ID && item.unread
    ).length;

    return {
      state,
      currentUserId: CURRENT_USER_ID,
      unreadInboxCount,
      getWorkspace,
      getProject,
      getIssue,
      getSquad,
      getActor,
      getUser,
      getRunsForIssue,
      getLatestRun,
      getCommentsForIssue,
      getArtifactsForProject,
      getBindingsForProject,
      getFilesForProject,
      getActivitiesForProject,
      getCatalogForWorkspace,
      getProjectsForWorkspace,
      getRecentProjects,
      getPersonalClawForUser: getPersonalClawForUserFn,
      getHumanForPersonalClaw: getHumanForPersonalClawFn,
      getDerivedHumanMembers: getDerivedHumanMembersFn,
      validateSquadComposition: validateSquadCompositionFn,
      executorLabel,
      createProject: (payload) => {
        const id = uid("proj");
        dispatch({ type: "create_project", payload: { ...payload, id } });
        return id;
      },
      updateProjectBrief: (projectId, contextBrief) =>
        dispatch({
          type: "update_project_brief",
          payload: { projectId, contextBrief },
        }),
      bindProjectResource: (payload) =>
        dispatch({ type: "bind_project_resource", payload }),
      unbindProjectResource: (bindingId) =>
        dispatch({ type: "unbind_project_resource", payload: { bindingId } }),
      addWorkingFile: (payload) =>
        dispatch({ type: "add_working_file", payload }),
      deleteWorkingFile: (fileId) =>
        dispatch({ type: "delete_working_file", payload: { fileId } }),
      createIssue: (payload) => {
        const id = uid("issue");
        dispatch({ type: "create_issue", payload: { ...payload, id } });
        return id;
      },
      updateIssueStatus: (issueId, status) =>
        dispatch({ type: "update_issue_status", payload: { issueId, status } }),
      assignIssue: (payload) => dispatch({ type: "assign_issue", payload }),
      addComment: (payload) => dispatch({ type: "add_comment", payload }),
      advanceRun: (runId) => dispatch({ type: "advance_run", payload: { runId } }),
      rerun: (runId) => dispatch({ type: "rerun", payload: { runId } }),
      cancelRun: (runId) => dispatch({ type: "cancel_run", payload: { runId } }),
      approveIssue: (issueId) =>
        dispatch({ type: "approve_issue", payload: { issueId } }),
      rejectIssue: (issueId, reason) =>
        dispatch({ type: "reject_issue", payload: { issueId, reason } }),
      createSquad: (payload) => {
        const composition = validateSquadComposition(
          payload.agentMembers,
          state.actors
        );
        if (!composition.ok) return null;
        const id = uid("squad");
        dispatch({ type: "create_squad", payload: { ...payload, id } });
        return id;
      },
      updateSquad: (payload) => {
        if (payload.agentMembers) {
          const composition = validateSquadComposition(
            payload.agentMembers,
            state.actors
          );
          if (!composition.ok) return false;
        }
        dispatch({ type: "update_squad", payload });
        return true;
      },
      acceptSquadInvitation: (payload) =>
        dispatch({ type: "accept_squad_invitation", payload }),
      markInboxRead: (inboxId) =>
        dispatch({ type: "mark_inbox_read", payload: { inboxId } }),
      markAllInboxRead: () => dispatch({ type: "mark_all_inbox_read" }),
    };
  }, [
    state,
    getWorkspace,
    getProject,
    getIssue,
    getSquad,
    getActor,
    getUser,
    getRunsForIssue,
    getLatestRun,
    getCommentsForIssue,
    getArtifactsForProject,
    getBindingsForProject,
    getFilesForProject,
    getActivitiesForProject,
    getCatalogForWorkspace,
    getProjectsForWorkspace,
    getRecentProjects,
    getPersonalClawForUserFn,
    getHumanForPersonalClawFn,
    getDerivedHumanMembersFn,
    validateSquadCompositionFn,
    executorLabel,
  ]);

  return (
    <CollaborationContext.Provider value={value}>
      {children}
    </CollaborationContext.Provider>
  );
}

export function useCollaboration() {
  const ctx = useContext(CollaborationContext);
  if (!ctx) {
    throw new Error("useCollaboration must be used within CollaborationProvider");
  }
  return ctx;
}

export function actorTypeLabel(type: AgentActor["type"]) {
  return ACTOR_TYPE_LABELS[type];
}
