"use client";

import {
  AlertCircle,
  Check,
  CircleDashed,
  Clock3,
  Code2,
  FileCode2,
  FileText,
  Folder,
  LoaderCircle,
  Package,
  Pencil,
  Plug,
  RotateCcw,
  Sparkles,
  Upload,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  DependencyStatus,
  SkillFile,
  SkillStatus,
  SkillVersionSource,
  WorkOrderStatus,
} from "./types";

export function SkillStatusPill({ status }: { status: SkillStatus }) {
  const meta: Record<SkillStatus, { label: string; className: string }> = {
    draft: { label: "未发布", className: "border-slate-200 bg-slate-50 text-slate-600" },
    reviewing: { label: "待确认", className: "border-amber-200 bg-amber-50 text-amber-700" },
    published: { label: "已发布", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
    offline: { label: "已下架", className: "border-slate-200 bg-slate-100 text-slate-500" },
    failed: { label: "审核失败", className: "border-rose-200 bg-rose-50 text-rose-700" },
  };
  const item = meta[status];

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-full border px-2 text-xs font-medium",
        item.className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {item.label}
    </span>
  );
}

export function WorkOrderStatusPill({ status }: { status: WorkOrderStatus }) {
  const meta: Record<
    WorkOrderStatus,
    { label: string; className: string; icon: LucideIcon }
  > = {
    generating: {
      label: "生成中",
      className: "border-amber-200 bg-amber-50 text-amber-700",
      icon: LoaderCircle,
    },
    "pending-confirmation": {
      label: "待确认",
      className: "border-blue-200 bg-blue-50 text-blue-700",
      icon: Clock3,
    },
    completed: {
      label: "已完成",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      icon: Check,
    },
    failed: {
      label: "失败",
      className: "border-rose-200 bg-rose-50 text-rose-700",
      icon: AlertCircle,
    },
  };
  const item = meta[status];
  const Icon = item.icon;

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full border px-2 text-xs font-medium",
        item.className
      )}
    >
      <Icon className={cn("h-3 w-3", status === "generating" && "animate-spin")} />
      {item.label}
    </span>
  );
}

export function DependencyStatusPill({ status }: { status: DependencyStatus }) {
  const meta: Record<DependencyStatus, { label: string; className: string }> = {
    ready: { label: "已满足", className: "bg-emerald-50 text-emerald-700" },
    missing: { label: "缺失", className: "bg-amber-50 text-amber-700" },
    offline: { label: "失效 · 已下架", className: "bg-rose-50 text-rose-700" },
  };
  const item = meta[status];
  return (
    <span className={cn("rounded-full px-2 py-1 text-xs font-medium", item.className)}>
      {item.label}
    </span>
  );
}

export function SourcePill({ source }: { source: SkillVersionSource }) {
  const meta: Record<SkillVersionSource, { label: string; icon: LucideIcon; className: string }> = {
    import: { label: "导入", icon: Upload, className: "bg-slate-100 text-slate-600" },
    "ai-create": { label: "AI 创建", icon: Sparkles, className: "bg-blue-50 text-blue-700" },
    "ai-optimize": { label: "AI 优化", icon: Sparkles, className: "bg-blue-50 text-blue-700" },
    "manual-edit": { label: "手动编辑", icon: Pencil, className: "bg-slate-100 text-slate-600" },
    rollback: { label: "回滚", icon: RotateCcw, className: "bg-slate-100 text-slate-600" },
  };
  const item = meta[source];
  const Icon = item.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-1 text-xs", item.className)}>
      <Icon className="h-3 w-3" />
      {item.label}
    </span>
  );
}

export function DependencyTypeIcon({ type }: { type: "runtime" | "mcp" | "plugin" | "external-service" }) {
  const Icon =
    type === "runtime" ? Package : type === "mcp" ? Plug : type === "plugin" ? Code2 : CircleDashed;
  return <Icon className="h-4 w-4" />;
}

export function FileGlyph({ path, open = false }: { path: string; open?: boolean }) {
  if (path.endsWith("/")) {
    return <Folder className={cn("h-4 w-4", open ? "text-blue-600" : "text-slate-400")} />;
  }
  if (path.endsWith(".md")) {
    return <FileText className="h-4 w-4 text-slate-500" />;
  }
  return <FileCode2 className="h-4 w-4 text-blue-500" />;
}

export function buildFileTree(files: SkillFile[]) {
  const folders = new Map<string, string[]>();
  const rootFiles: string[] = [];

  files.forEach((file) => {
    const segments = file.path.split("/");
    if (segments.length === 1) {
      rootFiles.push(file.path);
      return;
    }
    const folder = `${segments[0]}/`;
    const children = folders.get(folder) ?? [];
    children.push(file.path);
    folders.set(folder, children);
  });

  return { rootFiles, folders: [...folders.entries()] };
}
