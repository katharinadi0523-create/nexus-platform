"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bot,
  FolderKanban,
  ListTodo,
  Plus,
  Search,
  Users,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  ISSUE_STATUS_LABELS,
  type CollaborationProject,
  type IssueStatus,
} from "@/lib/mock/my-claw/collaboration";
import { useCollaboration } from "./collaboration-provider";
import { CreateProjectDialog } from "./create-project-dialog";
import { ActorAvatar } from "./shared/actor-avatar";
import { formatRelativeTime } from "./shared/format";

const ACTIVE_ISSUE_STATUSES: IssueStatus[] = [
  "backlog",
  "todo",
  "in_progress",
  "in_review",
  "blocked",
];

const SUMMARY_STATUSES: IssueStatus[] = [
  "todo",
  "in_progress",
  "in_review",
  "blocked",
  "done",
];

function countByStatus(
  issues: { status: IssueStatus }[]
): Partial<Record<IssueStatus, number>> {
  return issues.reduce<Partial<Record<IssueStatus, number>>>((acc, issue) => {
    acc[issue.status] = (acc[issue.status] ?? 0) + 1;
    return acc;
  }, {});
}

function ProjectCard({
  project,
  workspaceId,
  leadName,
  issueCounts,
}: {
  project: CollaborationProject;
  workspaceId: string;
  leadName: string;
  issueCounts: Partial<Record<IssueStatus, number>>;
}) {
  return (
    <Link
      href={`/my-claw/workspaces/${workspaceId}/projects/${project.id}`}
      className="block rounded-lg border border-[#e2e8f0] bg-white p-4 transition-colors hover:border-[#c9dbf8] hover:bg-[#f8fbff]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-[14px] font-semibold text-slate-900">
            {project.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-[#5a6779]">
            {project.description}
          </p>
        </div>
        {project.status === "archived" ? (
          <span className="shrink-0 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-500">
            已归档
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex items-center gap-2 text-[12px] text-[#5a6779]">
        <ActorAvatar name={leadName} type="human" size="sm" />
        <span>Lead · {leadName}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-[#5a6779]">
        <span className="inline-flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {project.memberIds.length} Human
        </span>
        <span className="inline-flex items-center gap-1">
          <Bot className="h-3.5 w-3.5" />
          {project.actorIds.length} Agent
        </span>
        <span className="inline-flex items-center gap-1">
          <UsersRound className="h-3.5 w-3.5" />
          {project.squadIds.length} Squad
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {SUMMARY_STATUSES.map((status) => {
          const count = issueCounts[status] ?? 0;
          if (!count) return null;
          return (
            <span
              key={status}
              className="rounded-md border border-[#eef2f6] bg-[#f8f9fb] px-1.5 py-0.5 text-[10px] text-[#5a6779]"
            >
              {ISSUE_STATUS_LABELS[status]} {count}
            </span>
          );
        })}
      </div>

      <div className="mt-3 text-[11px] text-[#8a97a8]">
        更新于 {formatRelativeTime(project.updatedAt)}
      </div>
    </Link>
  );
}

export function WorkspaceHome({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const {
    getWorkspace,
    getProjectsForWorkspace,
    getUser,
    state,
    currentUserId,
  } = useCollaboration();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "archived">(
    "active"
  );
  const [createOpen, setCreateOpen] = useState(false);

  const workspace = getWorkspace(workspaceId);
  const projects = getProjectsForWorkspace(workspaceId);

  const workspaceIssues = useMemo(
    () => state.issues.filter((issue) => issue.workspaceId === workspaceId),
    [state.issues, workspaceId]
  );
  const workspaceSquads = useMemo(
    () => state.squads.filter((squad) => squad.workspaceId === workspaceId),
    [state.squads, workspaceId]
  );
  const workspaceActors = useMemo(
    () => state.actors.filter((actor) => actor.workspaceId === workspaceId),
    [state.actors, workspaceId]
  );

  const stats = useMemo(() => {
    const activeIssues = workspaceIssues.filter((issue) =>
      ACTIVE_ISSUE_STATUSES.includes(issue.status)
    ).length;
    const runningAgents = workspaceActors.filter(
      (actor) => actor.runtimeStatus === "busy" || actor.activeRunCount > 0
    ).length;
    const pendingReview = workspaceIssues.filter(
      (issue) =>
        issue.status === "in_review" && issue.reviewerUserId === currentUserId
    ).length;
    return {
      projectCount: projects.length,
      activeIssues,
      runningAgents,
      squadCount: workspaceSquads.length,
      pendingReview,
    };
  }, [
    currentUserId,
    projects.length,
    workspaceActors,
    workspaceIssues,
    workspaceSquads.length,
  ]);

  const filteredProjects = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...projects]
      .filter((project) => {
        if (statusFilter !== "all" && project.status !== statusFilter) {
          return false;
        }
        if (!q) return true;
        return (
          project.name.toLowerCase().includes(q) ||
          project.description.toLowerCase().includes(q)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  }, [projects, query, statusFilter]);

  if (!workspace) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <FolderKanban className="mb-3 h-10 w-10 text-[#5a6779]" />
        <p className="text-sm font-medium text-slate-900">空间不存在</p>
        <p className="mt-1 text-[13px] text-[#5a6779]">
          该组织空间可能已被移除或无权访问
        </p>
        <Button
          className="mt-4 bg-[#2773ff] hover:bg-[#1f63e0]"
          onClick={() => router.push("/my-claw")}
        >
          返回个人空间
        </Button>
      </div>
    );
  }

  const statCards = [
    {
      label: "协作项目数",
      value: stats.projectCount,
      icon: FolderKanban,
    },
    {
      label: "跨 Project 活跃 Issue",
      value: stats.activeIssues,
      icon: ListTodo,
    },
    {
      label: "跨 Project 运行中 Agent",
      value: stats.runningAgents,
      icon: Bot,
    },
    {
      label: "跨 Project Squad 数",
      value: stats.squadCount,
      icon: UsersRound,
    },
    {
      label: "待当前用户验收",
      value: stats.pendingReview,
      icon: Users,
    },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-[#eef2f6] bg-white px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[12px] text-[#5a6779]">
              {workspace.organizationName}
            </div>
            <h1 className="mt-1 text-xl font-semibold text-slate-900">
              {workspace.name} · 全部 Project
            </h1>
            <p className="mt-1.5 max-w-2xl text-[13px] leading-5 text-[#5a6779]">
              {workspace.description}
            </p>
          </div>
          <Button
            className="bg-[#2773ff] hover:bg-[#1f63e0]"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            新建项目
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <p className="mb-3 text-[12px] text-[#5a6779]">
          以下指标为该空间下全部 Project 的聚合统计，不构成 Workspace 级协作上下文。
        </p>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="rounded-lg border border-[#e2e8f0] bg-white px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[#5a6779]">{card.label}</span>
                  <Icon className="h-3.5 w-3.5 text-[#2773ff]" />
                </div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">
                  {card.value}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[14px] font-semibold text-slate-900">项目</h2>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#5a6779]" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索项目…"
                  className="h-9 w-[220px] pl-8"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as "all" | "active" | "archived")
                }
                options={[
                  { value: "all", label: "全部状态" },
                  { value: "active", label: "进行中" },
                  { value: "archived", label: "已归档" },
                ]}
                className="w-[120px]"
              />
            </div>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#e2e8f0] bg-white px-6 py-16 text-center">
              <FolderKanban className="mb-3 h-10 w-10 text-[#5a6779]" />
              <p className="text-sm font-medium text-slate-900">暂无协作项目</p>
              <p className="mt-1 text-[13px] text-[#5a6779]">
                创建第一个项目，开始组织 Human、Agent 与 Squad 协作
              </p>
              <Button
                className="mt-4 bg-[#2773ff] hover:bg-[#1f63e0]"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                新建项目
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filteredProjects.map((project) => {
                const lead = getUser(project.leadUserId);
                const projectIssues = workspaceIssues.filter(
                  (issue) => issue.projectId === project.id
                );
                return (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    workspaceId={workspaceId}
                    leadName={lead?.name ?? "未指定"}
                    issueCounts={countByStatus(projectIssues)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      <CreateProjectDialog
        workspaceId={workspaceId}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  );
}
