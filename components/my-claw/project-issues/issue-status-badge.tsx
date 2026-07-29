"use client";

import { cn } from "@/lib/utils";
import {
  PROJECT_ISSUE_STATUS_LABELS,
  type ProjectIssueStatus,
} from "@/lib/mock/my-claw/project-issues";

const STATUS_STYLES: Record<ProjectIssueStatus, string> = {
  clarifying: "bg-slate-100 text-slate-700",
  in_progress: "bg-orange-50 text-orange-700",
  waiting_for_human: "bg-amber-50 text-amber-700",
  in_review: "bg-emerald-50 text-emerald-700",
  changes_requested: "bg-orange-50 text-orange-700",
  blocked: "bg-sky-50 text-sky-700",
  done: "bg-blue-50 text-blue-700",
  cancelled: "bg-slate-100 text-slate-500",
  archived: "bg-slate-100 text-slate-500",
};

interface IssueStatusBadgeProps {
  status: ProjectIssueStatus;
  className?: string;
}

export function IssueStatusBadge({ status, className }: IssueStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium",
        STATUS_STYLES[status],
        className
      )}
    >
      {PROJECT_ISSUE_STATUS_LABELS[status]}
    </span>
  );
}
