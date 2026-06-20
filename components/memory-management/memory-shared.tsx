import { BrainCircuit, CircleDot } from "lucide-react";
import type {
  MemoryStoreType,
  MountAccess,
  UpdateJobStatus,
} from "@/lib/mock/memory-management";
import { cn } from "@/lib/utils";

export const memoryStoreTypeLabels: Record<MemoryStoreType, string> = {
  shared: "共享",
  fork: "fork",
  builtin_c: "自带-C",
};

export const mountAccessLabels: Record<MountAccess, string> = {
  read_only: "只读",
  propose_only: "仅提议",
};

export const updateJobStatusLabels: Record<UpdateJobStatus, string> = {
  queued: "排队中",
  running: "运行中",
  pending_review: "待审核",
  published: "已发布",
  dismissed: "已驳回",
  failed: "失败",
};

const updateJobStatusClasses: Record<UpdateJobStatus, string> = {
  queued: "border-slate-200 bg-slate-50 text-slate-600",
  running: "border-blue-200 bg-blue-50 text-blue-700",
  pending_review: "border-amber-200 bg-amber-50 text-amber-700",
  published: "border-emerald-200 bg-emerald-50 text-emerald-700",
  dismissed: "border-slate-200 bg-slate-100 text-slate-600",
  failed: "border-rose-200 bg-rose-50 text-rose-700",
};

const storeTypeClasses: Record<MemoryStoreType, string> = {
  shared: "border-blue-200 bg-blue-50 text-blue-700",
  fork: "border-violet-200 bg-violet-50 text-violet-700",
  builtin_c: "border-slate-200 bg-slate-100 text-slate-700",
};

export function formatCompactNumber(value: number) {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(value >= 100000 ? 0 : 1)}万`;
  }
  return new Intl.NumberFormat("zh-CN").format(value);
}

export function MemoryStoreIcon({
  type,
  className,
}: {
  type: MemoryStoreType;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px]",
        type === "builtin_c"
          ? "bg-slate-700 text-white"
          : type === "fork"
            ? "bg-violet-500 text-white"
            : "bg-blue-600 text-white",
        className
      )}
    >
      <BrainCircuit className="h-5 w-5" />
    </span>
  );
}

export function StoreTypeBadge({ type }: { type: MemoryStoreType }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-[3px] border px-2 text-xs font-medium",
        storeTypeClasses[type]
      )}
    >
      {memoryStoreTypeLabels[type]}
    </span>
  );
}

export function UpdateJobStatusBadge({ status }: { status: UpdateJobStatus }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-[3px] border px-2 text-xs font-medium",
        updateJobStatusClasses[status]
      )}
    >
      <CircleDot className={cn("h-3 w-3", status === "running" && "animate-pulse")} />
      {updateJobStatusLabels[status]}
    </span>
  );
}

export function AccessBadge({ access }: { access: MountAccess }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-[3px] border px-2 text-xs font-medium",
        access === "propose_only"
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : "border-slate-200 bg-slate-50 text-slate-600"
      )}
    >
      {mountAccessLabels[access]}
    </span>
  );
}
