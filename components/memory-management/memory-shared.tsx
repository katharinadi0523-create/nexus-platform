import { BrainCircuit, CircleDot } from "lucide-react";
import type {
  DreamingInputRef,
  DreamingJobStatus,
  MemoryNodeType,
  MemoryStoreKind,
  MountAccess,
} from "@/lib/mock/memory-management";
import { cn } from "@/lib/utils";

export const memoryStoreKindLabels: Record<MemoryStoreKind, string> = {
  builtin: "自带 · C",
  shared: "共享 · S",
  fork: "fork",
};

// 本期挂载库统一为「全量读写」。
export const mountAccessLabels: Record<MountAccess, string> = {
  read_write: "全量读写",
};

export const dreamingInputRefLabels: Record<DreamingInputRef, string> = {
  store_content: "库当前内容",
  session: "原始会话",
};

export const memoryNodeTypeLabels: Record<MemoryNodeType, string> = {
  user: "用户画像",
  feedback: "行为反馈",
  project: "项目语境",
  reference: "信息入口",
};

export const dreamingJobStatusLabels: Record<DreamingJobStatus, string> = {
  queued: "排队中",
  running: "运行中",
  pending_review: "待审核",
  published: "已发布",
  dismissed: "已驳回",
  failed: "失败",
};

const dreamingJobStatusClasses: Record<DreamingJobStatus, string> = {
  queued: "border-slate-200 bg-slate-50 text-slate-600",
  running: "border-blue-200 bg-blue-50 text-blue-700",
  pending_review: "border-amber-200 bg-amber-50 text-amber-700",
  published: "border-emerald-200 bg-emerald-50 text-emerald-700",
  dismissed: "border-slate-200 bg-slate-100 text-slate-600",
  failed: "border-rose-200 bg-rose-50 text-rose-700",
};

const storeKindClasses: Record<MemoryStoreKind, string> = {
  shared: "border-blue-200 bg-blue-50 text-blue-700",
  fork: "border-violet-200 bg-violet-50 text-violet-700",
  builtin: "border-slate-200 bg-slate-100 text-slate-700",
};

export function formatCompactNumber(value: number) {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(value >= 100000 ? 0 : 1)}万`;
  }
  return new Intl.NumberFormat("zh-CN").format(value);
}

export function MemoryStoreIcon({
  kind,
  className,
}: {
  kind: MemoryStoreKind;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px]",
        kind === "builtin"
          ? "bg-slate-700 text-white"
          : kind === "fork"
            ? "bg-violet-500 text-white"
            : "bg-blue-600 text-white",
        className
      )}
    >
      <BrainCircuit className="h-5 w-5" />
    </span>
  );
}

export function StoreKindBadge({ kind }: { kind: MemoryStoreKind }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-[3px] border px-2 text-xs font-medium",
        storeKindClasses[kind]
      )}
    >
      {memoryStoreKindLabels[kind]}
    </span>
  );
}

export function DreamingJobStatusBadge({ status }: { status: DreamingJobStatus }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-[3px] border px-2 text-xs font-medium",
        dreamingJobStatusClasses[status]
      )}
    >
      <CircleDot className={cn("h-3 w-3", status === "running" && "animate-pulse")} />
      {dreamingJobStatusLabels[status]}
    </span>
  );
}

export function AccessBadge({ access }: { access: MountAccess }) {
  return (
    <span className="inline-flex h-6 items-center rounded-[3px] border border-blue-200 bg-blue-50 px-2 text-xs font-medium text-blue-700">
      {mountAccessLabels[access]}
    </span>
  );
}
