"use client";

import { useMemo, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  AtSign,
  Bot,
  CheckCircle2,
  FileText,
  FolderKanban,
  ListTodo,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ISSUE_STATUS_LABELS,
  type IssueStatus,
} from "@/lib/mock/my-claw/collaboration";
import { useCollaboration } from "./collaboration-provider";
import { ProjectHeader } from "./project-header";
import { IssueStatusBadge } from "./shared/issue-status-badge";
import { formatRelativeTime } from "./shared/format";

const OVERVIEW_STATUSES: IssueStatus[] = [
  "todo",
  "in_progress",
  "in_review",
  "blocked",
  "done",
];

function ModuleCard({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-[#e2e8f0] bg-white">
      <div className="flex items-center justify-between border-b border-[#eef2f6] px-4 py-3">
        <h2 className="text-[13px] font-semibold text-slate-900">{title}</h2>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <p className="py-4 text-center text-[12px] text-[#8a97a8]">{text}</p>;
}

export function ProjectOverview({
  workspaceId,
  projectId,
}: {
  workspaceId: string;
  projectId: string;
}) {
  const router = useRouter();
  const {
    getProject,
    getUser,
    getActor,
    getSquad,
    getIssue,
    currentUserId,
    state,
    getArtifactsForProject,
    getActivitiesForProject,
  } = useCollaboration();

  const project = getProject(projectId);
  const projectBase = `/my-claw/workspaces/${workspaceId}/projects/${projectId}`;

  const issues = useMemo(
    () =>
      state.issues.filter(
        (issue) =>
          issue.projectId === projectId && issue.workspaceId === workspaceId
      ),
    [projectId, state.issues, workspaceId]
  );

  const myWork = useMemo(() => {
    const assigned = issues.filter(
      (issue) =>
        issue.ownerUserId === currentUserId ||
        (issue.executor?.kind === "human" && issue.executor.id === currentUserId)
    );
    const pendingReview = issues.filter(
      (issue) =>
        issue.status === "in_review" && issue.reviewerUserId === currentUserId
    );
    const mentionedInbox = state.inboxItems.filter(
      (item) =>
        item.userId === currentUserId &&
        item.unread &&
        item.type === "mentioned" &&
        item.source.kind === "project" &&
        item.source.projectId === projectId
    );
    const mentionComments = state.comments.filter((comment) => {
      if (!comment.content.includes("@若楠")) return false;
      const issue = getIssue(comment.issueId);
      return issue?.projectId === projectId;
    });
    return { assigned, pendingReview, mentionedInbox, mentionComments };
  }, [
    currentUserId,
    getIssue,
    issues,
    projectId,
    state.comments,
    state.inboxItems,
  ]);

  const statusCounts = useMemo(() => {
    const counts = {} as Record<IssueStatus, number>;
    for (const status of OVERVIEW_STATUSES) counts[status] = 0;
    for (const issue of issues) {
      if (OVERVIEW_STATUSES.includes(issue.status)) {
        counts[issue.status] += 1;
      }
    }
    return counts;
  }, [issues]);

  const runSummary = useMemo(() => {
    const projectRuns = state.runs.filter((run) => run.projectId === projectId);
    const agents = project
      ? project.actorIds
          .map((id) => getActor(id))
          .filter((actor): actor is NonNullable<typeof actor> => Boolean(actor))
      : [];
    const squads = project
      ? project.squadIds
          .map((id) => getSquad(id))
          .filter((squad): squad is NonNullable<typeof squad> => Boolean(squad))
      : [];
    return {
      running: projectRuns.filter((run) => run.status === "running").length,
      queued: projectRuns.filter((run) => run.status === "queued").length,
      failed: projectRuns.filter((run) => run.status === "failed").length,
      offlineAgents: agents.filter((actor) => actor.runtimeStatus === "offline")
        .length,
      degradedSquads: squads.filter((squad) => squad.status === "degraded")
        .length,
    };
  }, [getActor, getSquad, project, projectId, state.runs]);

  const artifacts = useMemo(
    () =>
      getArtifactsForProject(projectId)
        .slice()
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 6),
    [getArtifactsForProject, projectId]
  );

  const activities = useMemo(
    () => getActivitiesForProject(projectId).slice(0, 8),
    [getActivitiesForProject, projectId]
  );

  if (!project || project.workspaceId !== workspaceId) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <FolderKanban className="mb-3 h-10 w-10 text-[#5a6779]" />
        <p className="text-sm font-medium text-slate-900">项目不存在</p>
        <p className="mt-1 text-[13px] text-[#5a6779]">
          该协作项目可能已归档或不可访问
        </p>
        <Button
          className="mt-4 bg-[#2773ff] hover:bg-[#1f63e0]"
          onClick={() => router.push(`/my-claw/workspaces/${workspaceId}`)}
        >
          返回空间首页
        </Button>
      </div>
    );
  }

  const lead = getUser(project.leadUserId);
  const humans = project.memberIds
    .map((id) => getUser(id))
    .filter((user): user is NonNullable<typeof user> => Boolean(user));
  const agents = project.actorIds
    .map((id) => getActor(id))
    .filter((actor): actor is NonNullable<typeof actor> => Boolean(actor));
  const squads = project.squadIds
    .map((id) => getSquad(id))
    .filter((squad): squad is NonNullable<typeof squad> => Boolean(squad));

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <ProjectHeader
        workspaceId={workspaceId}
        project={project}
        lead={lead}
        humans={humans}
        agents={agents}
        squads={squads}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <div className="grid gap-4 xl:grid-cols-2">
          <ModuleCard
            title="我的工作"
            action={
              <Link
                href={`${projectBase}/issues`}
                className="text-[12px] text-[#2773ff] hover:underline"
              >
                查看全部
              </Link>
            }
          >
            <div className="space-y-4">
              <div>
                <div className="mb-2 flex items-center gap-1.5 text-[12px] font-medium text-slate-700">
                  <ListTodo className="h-3.5 w-3.5 text-[#2773ff]" />
                  分配给我
                  <span className="text-[#8a97a8]">({myWork.assigned.length})</span>
                </div>
                {myWork.assigned.length === 0 ? (
                  <EmptyHint text="暂无分配给你的 Issue" />
                ) : (
                  <ul className="space-y-1.5">
                    {myWork.assigned.slice(0, 4).map((issue) => (
                      <li key={issue.id}>
                        <Link
                          href={`${projectBase}/issues/${issue.id}`}
                          className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-[#f8f9fb]"
                        >
                          <span className="min-w-0 truncate text-[13px] text-slate-800">
                            <span className="mr-1.5 text-[#5a6779]">
                              {issue.key}
                            </span>
                            {issue.title}
                          </span>
                          <IssueStatusBadge status={issue.status} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center gap-1.5 text-[12px] font-medium text-slate-700">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#2773ff]" />
                  待我验收
                  <span className="text-[#8a97a8]">
                    ({myWork.pendingReview.length})
                  </span>
                </div>
                {myWork.pendingReview.length === 0 ? (
                  <EmptyHint text="暂无待验收项" />
                ) : (
                  <ul className="space-y-1.5">
                    {myWork.pendingReview.slice(0, 4).map((issue) => (
                      <li key={issue.id}>
                        <Link
                          href={`${projectBase}/issues/${issue.id}`}
                          className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-[#f8f9fb]"
                        >
                          <span className="min-w-0 truncate text-[13px] text-slate-800">
                            <span className="mr-1.5 text-[#5a6779]">
                              {issue.key}
                            </span>
                            {issue.title}
                          </span>
                          <IssueStatusBadge status={issue.status} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center gap-1.5 text-[12px] font-medium text-slate-700">
                  <AtSign className="h-3.5 w-3.5 text-[#2773ff]" />
                  @我的未读讨论
                  <span className="text-[#8a97a8]">
                    ({myWork.mentionedInbox.length})
                  </span>
                </div>
                {myWork.mentionedInbox.length === 0 &&
                myWork.mentionComments.length === 0 ? (
                  <EmptyHint text="暂无 @ 你的未读讨论" />
                ) : (
                  <ul className="space-y-1.5">
                    {myWork.mentionedInbox.slice(0, 3).map((item) => (
                      <li key={item.id}>
                        <Link
                          href="/my-claw/inbox"
                          className="block rounded-md px-2 py-1.5 hover:bg-[#f8f9fb]"
                        >
                          <div className="truncate text-[13px] text-slate-800">
                            {item.title}
                          </div>
                          <div className="truncate text-[11px] text-[#5a6779]">
                            {item.summary}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </ModuleCard>

          <ModuleCard title="Issue 概览">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {OVERVIEW_STATUSES.map((status) => (
                <Link
                  key={status}
                  href={`${projectBase}/issues?status=${status}`}
                  className="rounded-lg border border-[#eef2f6] bg-[#f8f9fb] px-3 py-3 transition-colors hover:border-[#c9dbf8] hover:bg-[#f0f6ff]"
                >
                  <div className="text-[11px] text-[#5a6779]">
                    {ISSUE_STATUS_LABELS[status]}
                  </div>
                  <div className="mt-1 text-xl font-semibold text-slate-900">
                    {statusCounts[status]}
                  </div>
                </Link>
              ))}
            </div>
          </ModuleCard>

          <ModuleCard
            title="Agent / Squad 运行状态"
            action={
              <Link
                href={`${projectBase}/squads`}
                className="text-[12px] text-[#2773ff] hover:underline"
              >
                查看小队
              </Link>
            }
          >
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                {
                  label: "Running",
                  value: runSummary.running,
                  icon: Bot,
                },
                {
                  label: "Queued",
                  value: runSummary.queued,
                  icon: ListTodo,
                },
                {
                  label: "Failed",
                  value: runSummary.failed,
                  icon: Activity,
                },
                {
                  label: "Offline / Degraded",
                  value:
                    runSummary.offlineAgents + runSummary.degradedSquads,
                  icon: UsersRound,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="rounded-lg border border-[#eef2f6] bg-[#f8f9fb] px-3 py-3"
                  >
                    <div className="flex items-center gap-1 text-[11px] text-[#5a6779]">
                      <Icon className="h-3 w-3" />
                      {item.label}
                    </div>
                    <div className="mt-1 text-xl font-semibold text-slate-900">
                      {item.value}
                    </div>
                  </div>
                );
              })}
            </div>
          </ModuleCard>

          <ModuleCard title="最近产物">
            {artifacts.length === 0 ? (
              <EmptyHint text="暂无产物" />
            ) : (
              <ul className="space-y-2">
                {artifacts.map((artifact) => {
                  const issue = artifact.issueId
                    ? getIssue(artifact.issueId)
                    : undefined;
                  return (
                    <li
                      key={artifact.id}
                      className="flex items-start gap-2.5 rounded-md px-1 py-1"
                    >
                      <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-md bg-[#e8f0fb] text-[#2773ff]">
                        <FileText className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium text-slate-800">
                          {artifact.name}
                        </div>
                        <div className="mt-0.5 flex flex-wrap gap-x-2 text-[11px] text-[#5a6779]">
                          {issue ? <span>{issue.key}</span> : null}
                          <span>{artifact.createdByLabel}</span>
                          <span>{formatRelativeTime(artifact.createdAt)}</span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </ModuleCard>

          <ModuleCard
            title="最近动态"
            action={
              <Link
                href={`${projectBase}/activity`}
                className="text-[12px] text-[#2773ff] hover:underline"
              >
                全部动态
              </Link>
            }
          >
            {activities.length === 0 ? (
              <EmptyHint text="暂无动态" />
            ) : (
              <ul className="space-y-2.5">
                {activities.map((activity) => (
                  <li key={activity.id} className="flex gap-2.5">
                    <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2773ff]" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[13px] font-medium text-slate-800">
                          {activity.title}
                        </span>
                        <span className="shrink-0 text-[11px] text-[#8a97a8]">
                          {formatRelativeTime(activity.createdAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-[12px] text-[#5a6779]">
                        {activity.actorLabel} · {activity.summary}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </ModuleCard>
        </div>
      </div>
    </div>
  );
}
