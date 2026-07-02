import { cn } from "@/lib/utils";
import type { AgentMonitorStatus, RiskLevel } from "@/lib/mock/space-operations-dashboard";

const RISK_LEVEL_STYLES: Record<RiskLevel, string> = {
  高: "border-red-200 bg-red-50 text-red-700",
  中: "border-amber-200 bg-amber-50 text-amber-800",
  低: "border-slate-200 bg-slate-50 text-slate-600",
};

const MONITOR_STATUS_STYLES: Record<AgentMonitorStatus, { dot: string; badge: string }> = {
  正常: {
    dot: "bg-emerald-500",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  观察中: {
    dot: "bg-amber-500",
    badge: "border-amber-200 bg-amber-50 text-amber-800",
  },
  异常: {
    dot: "bg-red-500",
    badge: "border-red-200 bg-red-50 text-red-700",
  },
  已处置: {
    dot: "bg-slate-400",
    badge: "border-slate-200 bg-slate-100 text-slate-600",
  },
};

export function RiskLevelBadge({ level, className }: { level: RiskLevel; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        RISK_LEVEL_STYLES[level],
        className
      )}
    >
      {level}
    </span>
  );
}

export function MonitorStatusBadge({
  status,
  showDot = true,
  className,
}: {
  status: AgentMonitorStatus;
  showDot?: boolean;
  className?: string;
}) {
  const styles = MONITOR_STATUS_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
        styles.badge,
        className
      )}
    >
      {showDot ? (
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", styles.dot)} aria-hidden />
      ) : null}
      {status}
    </span>
  );
}
