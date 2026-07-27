import { cn } from "@/lib/utils";
import {
  ISSUE_STATUS_LABELS,
  type IssueStatus,
} from "@/lib/mock/my-claw/collaboration";

const STYLES: Record<IssueStatus, string> = {
  backlog: "border-slate-200 bg-slate-50 text-slate-600",
  todo: "border-blue-200 bg-blue-50 text-blue-700",
  in_progress: "border-indigo-200 bg-indigo-50 text-indigo-700",
  in_review: "border-amber-200 bg-amber-50 text-amber-800",
  done: "border-emerald-200 bg-emerald-50 text-emerald-700",
  blocked: "border-rose-200 bg-rose-50 text-rose-700",
  cancelled: "border-slate-200 bg-slate-100 text-slate-500",
};

export function IssueStatusBadge({
  status,
  className,
}: {
  status: IssueStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium",
        STYLES[status],
        className
      )}
    >
      {ISSUE_STATUS_LABELS[status]}
    </span>
  );
}
