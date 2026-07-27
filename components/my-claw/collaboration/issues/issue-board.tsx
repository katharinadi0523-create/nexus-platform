"use client";

import {
  BOARD_COLUMNS,
  ISSUE_STATUS_LABELS,
  type Issue,
  type Run,
} from "@/lib/mock/my-claw/collaboration";
import { IssueCard } from "./issue-card";

type BoardColumnStatus =
  | "backlog"
  | "todo"
  | "in_progress"
  | "in_review"
  | "done";

const COLUMN_STYLES: Record<
  BoardColumnStatus,
  { bg: string; header: string; count: string }
> = {
  backlog: {
    bg: "bg-[#f1f5f9]",
    header: "text-slate-700",
    count: "bg-white/80 text-slate-600",
  },
  todo: {
    bg: "bg-[#e0f2fe]",
    header: "text-sky-800",
    count: "bg-white/80 text-sky-700",
  },
  in_progress: {
    bg: "bg-[#ffedd5]",
    header: "text-orange-900",
    count: "bg-white/80 text-orange-800",
  },
  in_review: {
    bg: "bg-[#dcfce7]",
    header: "text-emerald-900",
    count: "bg-white/80 text-emerald-800",
  },
  done: {
    bg: "bg-[#dbeafe]",
    header: "text-blue-900",
    count: "bg-white/80 text-blue-800",
  },
};

export interface IssueBoardProps {
  issues: Issue[];
  workspaceId: string;
  projectId: string;
  projectName: string;
  getLatestRun: (issueId: string) => Run | undefined;
}

export function IssueBoard({
  issues,
  workspaceId,
  projectId,
  projectName,
  getLatestRun,
}: IssueBoardProps) {
  const columns = (BOARD_COLUMNS as BoardColumnStatus[]).map((status) => ({
    status,
    items: issues.filter((issue) => issue.status === status),
  }));

  if (issues.length === 0) {
    return (
      <div className="flex h-full min-h-[320px] items-center justify-center rounded-xl border border-dashed border-[#e2e8f0] bg-white">
        <div className="text-center">
          <p className="text-sm font-medium text-slate-900">暂无工作项</p>
          <p className="mt-1 text-[13px] text-[#5a6779]">
            新建 Issue 后会出现在看板列中
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 gap-3 overflow-x-auto pb-2">
      {columns.map(({ status, items }) => {
        const style = COLUMN_STYLES[status];
        return (
          <div
            key={status}
            className={`flex w-[260px] shrink-0 flex-col rounded-2xl ${style.bg} p-2.5`}
          >
            <div className="mb-2.5 flex items-center justify-between px-1.5 pt-0.5">
              <h3 className={`text-[13px] font-semibold ${style.header}`}>
                {ISSUE_STATUS_LABELS[status]}
              </h3>
              <span
                className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium ${style.count}`}
              >
                {items.length}
              </span>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-0.5 pb-1">
              {items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/70 px-3 py-6 text-center text-[12px] text-[#94a3b8]">
                  暂无
                </div>
              ) : (
                items.map((issue) => (
                  <IssueCard
                    key={issue.id}
                    issue={issue}
                    projectName={projectName}
                    latestRun={getLatestRun(issue.id)}
                    href={`/my-claw/workspaces/${workspaceId}/projects/${projectId}/issues/${issue.id}`}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
