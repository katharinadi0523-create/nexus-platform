"use client";

import { ReactNode } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { AlertTriangle, LucideIcon, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface BaseNodeProps {
  icon: LucideIcon;
  label: string;
  color: "green" | "red" | "blue" | "purple" | "orange";
  selected?: boolean;
  children: ReactNode;
  showTargetHandle?: boolean;
  showSourceHandle?: boolean;
}

type BaseNodeComponentProps = NodeProps & BaseNodeProps;

const colorMap = {
  green: {
    bg: "bg-green-100",
    icon: "text-green-600",
    border: "border-green-500",
  },
  red: {
    bg: "bg-red-100",
    icon: "text-red-600",
    border: "border-red-500",
  },
  blue: {
    bg: "bg-blue-100",
    icon: "text-blue-600",
    border: "border-blue-500",
  },
  purple: {
    bg: "bg-purple-100",
    icon: "text-purple-600",
    border: "border-purple-500",
  },
  orange: {
    bg: "bg-orange-100",
    icon: "text-orange-600",
    border: "border-orange-500",
  },
};

export function BaseNode({
  icon: Icon,
  label,
  color,
  selected = false,
  children,
  showTargetHandle = true,
  showSourceHandle = true,
  ...nodeProps
}: BaseNodeComponentProps) {
  const isSelected = selected;
  const colors = colorMap[color];
  const importIssue = nodeProps.data?.importIssue as
    | { title: string; resourceName: string; detail: string; message?: string }
    | undefined;
  
  // 优先使用 data.description 或 data.label，如果没有则使用传入的 label
  const displayLabel = nodeProps.data?.description || nodeProps.data?.label || label;

  return (
    <div
      className={cn(
        "w-[280px] bg-white rounded-lg border shadow-sm transition-all",
        importIssue
          ? "border-amber-400 ring-2 ring-amber-100"
          : isSelected
          ? `ring-2 ring-primary border-primary ${colors.border}`
          : "border-slate-200"
      )}
    >
      {/* Target Handle */}
      {showTargetHandle && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-200">
        <div className={cn("w-6 h-6 rounded flex items-center justify-center", colors.bg)}>
          <Icon className={cn("w-4 h-4", colors.icon)} />
        </div>
        <span className="flex-1 text-sm font-medium text-slate-900">{displayLabel}</span>
        {importIssue ? <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" aria-label="存在待补配资源" /> : null}
        <MoreHorizontal className="w-4 h-4 text-slate-400" />
      </div>

      {importIssue ? (
        <div className="flex items-start gap-2 border-b border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
          <span><strong className="font-semibold">{importIssue.title}：</strong>{importIssue.resourceName}</span>
        </div>
      ) : null}

      {/* Content */}
      <div className="p-3">{children}</div>

      {/* Source Handle */}
      {showSourceHandle && (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
        />
      )}
    </div>
  );
}
