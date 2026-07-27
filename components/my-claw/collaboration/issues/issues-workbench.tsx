"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, List, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  ISSUE_PRIORITY_LABELS,
  ISSUE_STATUS_LABELS,
  type IssuePriority,
  type IssueStatus,
} from "@/lib/mock/my-claw/collaboration";
import { useCollaboration } from "../collaboration-provider";
import { IssueBoard } from "./issue-board";
import { IssueCreateDialog } from "./issue-create-dialog";
import { IssueList } from "./issue-list";

export interface IssuesWorkbenchProps {
  workspaceId: string;
  projectId: string;
}

type ViewMode = "list" | "board";
type ExecutorTypeFilter = "all" | "human" | "agent" | "squad" | "unassigned";

export function IssuesWorkbench({
  workspaceId,
  projectId,
}: IssuesWorkbenchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    getProject,
    getWorkspace,
    state,
    getLatestRun,
    getUser,
  } = useCollaboration();

  const project = getProject(projectId);
  const workspace = getWorkspace(workspaceId);

  const initialView =
    searchParams.get("view") === "list" ? "list" : "board";
  const initialStatus = searchParams.get("status") as IssueStatus | null;

  const [view, setView] = useState<ViewMode>(initialView);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(
    initialStatus && initialStatus in ISSUE_STATUS_LABELS
      ? initialStatus
      : "all"
  );
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [executorTypeFilter, setExecutorTypeFilter] =
    useState<ExecutorTypeFilter>("all");
  const [createOpen, setCreateOpen] = useState(false);

  const syncUrl = (nextView: ViewMode, nextStatus: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", nextView);
    if (nextStatus === "all") params.delete("status");
    else params.set("status", nextStatus);
    const qs = params.toString();
    router.replace(
      `/my-claw/workspaces/${workspaceId}/projects/${projectId}/issues${
        qs ? `?${qs}` : ""
      }`
    );
  };

  const issues = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.issues
      .filter(
        (issue) =>
          issue.workspaceId === workspaceId && issue.projectId === projectId
      )
      .filter((issue) => {
        if (statusFilter !== "all" && issue.status !== statusFilter) {
          return false;
        }
        if (priorityFilter !== "all" && issue.priority !== priorityFilter) {
          return false;
        }
        if (ownerFilter !== "all" && issue.ownerUserId !== ownerFilter) {
          return false;
        }
        if (executorTypeFilter === "unassigned" && issue.executor) {
          return false;
        }
        if (
          executorTypeFilter !== "all" &&
          executorTypeFilter !== "unassigned" &&
          issue.executor?.kind !== executorTypeFilter
        ) {
          return false;
        }
        if (!q) return true;
        return (
          issue.key.toLowerCase().includes(q) ||
          issue.title.toLowerCase().includes(q) ||
          issue.description.toLowerCase().includes(q)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  }, [
    executorTypeFilter,
    ownerFilter,
    priorityFilter,
    projectId,
    query,
    state.issues,
    statusFilter,
    workspaceId,
  ]);

  if (!workspace || !project || project.workspaceId !== workspaceId) {
    return (
      <div className="flex h-full items-center justify-center bg-[#f8f9fb]">
        <div className="text-center">
          <p className="text-sm font-medium text-slate-900">项目不存在</p>
          <p className="mt-1 text-[13px] text-[#5a6779]">
            请从组织空间重新进入协作项目
          </p>
        </div>
      </div>
    );
  }

  const ownerOptions = [
    { value: "all", label: "全部 Owner" },
    ...project.memberIds.map((id) => ({
      value: id,
      label: getUser(id)?.name ?? id,
    })),
  ];

  const statusOptions = [
    { value: "all", label: "全部状态" },
    ...(Object.keys(ISSUE_STATUS_LABELS) as IssueStatus[]).map((status) => ({
      value: status,
      label: ISSUE_STATUS_LABELS[status],
    })),
  ];

  const priorityOptions = [
    { value: "all", label: "全部优先级" },
    ...(Object.keys(ISSUE_PRIORITY_LABELS) as IssuePriority[]).map(
      (priority) => ({
        value: priority,
        label: ISSUE_PRIORITY_LABELS[priority],
      })
    ),
  ];

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f8f9fb]">
      <div className="shrink-0 border-b border-[#e7ecf0] bg-white px-6 py-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">工作项</h1>
            <p className="mt-0.5 text-[12px] text-[#5a6779]">
              {project.name} · Issue 业务状态与 Run 进程状态分开呈现
            </p>
          </div>
          <Button
            className="bg-[#2773ff] hover:bg-[#1f63e0]"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            新建 Issue
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-[#e7ecf0] bg-[#f8f9fb] p-0.5">
            <button
              type="button"
              onClick={() => {
                setView("list");
                syncUrl("list", statusFilter);
              }}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-colors ${
                view === "list"
                  ? "bg-white text-[#2773ff] shadow-sm"
                  : "text-[#5a6779] hover:text-slate-700"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              List
            </button>
            <button
              type="button"
              onClick={() => {
                setView("board");
                syncUrl("board", statusFilter);
              }}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-colors ${
                view === "board"
                  ? "bg-white text-[#2773ff] shadow-sm"
                  : "text-[#5a6779] hover:text-slate-700"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Board
            </button>
          </div>

          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94a3b8]" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索 Key / 标题 / 描述"
              className="h-9 bg-white pl-8"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              syncUrl(view, value);
            }}
            options={statusOptions}
            className="h-9 w-[140px] bg-white"
          />
          <Select
            value={priorityFilter}
            onValueChange={setPriorityFilter}
            options={priorityOptions}
            className="h-9 w-[130px] bg-white"
          />
          <Select
            value={ownerFilter}
            onValueChange={setOwnerFilter}
            options={ownerOptions}
            className="h-9 w-[130px] bg-white"
          />
          <Select
            value={executorTypeFilter}
            onValueChange={(value) =>
              setExecutorTypeFilter(value as ExecutorTypeFilter)
            }
            options={[
              { value: "all", label: "全部 Executor" },
              { value: "human", label: "Human" },
              { value: "agent", label: "Agent" },
              { value: "squad", label: "Squad" },
              { value: "unassigned", label: "未指派" },
            ]}
            className="h-9 w-[140px] bg-white"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-6">
        {view === "board" ? (
          <IssueBoard
            issues={issues}
            workspaceId={workspaceId}
            projectId={projectId}
            projectName={project.name}
            getLatestRun={getLatestRun}
          />
        ) : (
          <IssueList
            issues={issues}
            workspaceId={workspaceId}
            projectId={projectId}
            getLatestRun={getLatestRun}
          />
        )}
      </div>

      <IssueCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        workspaceId={workspaceId}
        projectId={projectId}
        onCreated={(issueId) => {
          router.push(
            `/my-claw/workspaces/${workspaceId}/projects/${projectId}/issues/${issueId}`
          );
        }}
      />
    </div>
  );
}
