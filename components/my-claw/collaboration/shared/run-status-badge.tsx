import { cn } from "@/lib/utils";
import {
  RUN_STATUS_LABELS,
  type RunStatus,
} from "@/lib/mock/my-claw/collaboration";

const STYLES: Record<RunStatus, string> = {
  queued: "border-slate-200 bg-slate-50 text-slate-600",
  running: "border-blue-200 bg-blue-50 text-blue-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  failed: "border-rose-200 bg-rose-50 text-rose-700",
  cancelled: "border-slate-200 bg-slate-100 text-slate-500",
};

export function RunStatusBadge({
  status,
  className,
}: {
  status: RunStatus;
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
      Run {RUN_STATUS_LABELS[status]}
    </span>
  );
}
