import { cn } from "@/lib/utils";
import {
  SQUAD_STATUS_LABELS,
  type Squad,
} from "@/lib/mock/my-claw/collaboration";

const STYLES: Record<Squad["status"], string> = {
  ready: "border-emerald-200 bg-emerald-50 text-emerald-700",
  running: "border-blue-200 bg-blue-50 text-blue-700",
  degraded: "border-amber-200 bg-amber-50 text-amber-800",
};

export function SquadStatusBadge({
  status,
  className,
}: {
  status: Squad["status"];
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
      {SQUAD_STATUS_LABELS[status]}
    </span>
  );
}
