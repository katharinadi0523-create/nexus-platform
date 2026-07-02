"use client";

import { useState } from "react";
import { PackageSearch } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { AgentBomTreeNode } from "@/components/claw-hub-next/agent-bom-tree";
import { cn } from "@/lib/utils";

function AgentBomTreeRow({
  node,
  depth = 0,
  indexPath,
}: {
  node: AgentBomTreeNode;
  depth?: number;
  indexPath: string;
}) {
  const hasChildren = Boolean(node.children?.length);

  return (
    <div>
      <div
        className={cn(
          "flex items-start gap-2 py-1.5",
          depth === 0 && "border-b border-slate-100 last:border-b-0"
        )}
        style={{ paddingLeft: `${depth * 14}px` }}
      >
        <span className="mt-0.5 shrink-0 font-mono text-[11px] leading-4 text-slate-400">{indexPath}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("text-sm", depth === 0 ? "font-semibold text-slate-900" : "font-medium text-slate-700")}>
              {node.label}
            </span>
            {typeof node.count === "number" ? (
              <span className="inline-flex items-center rounded-[4px] bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                {node.count}
              </span>
            ) : null}
          </div>
          {node.detail ? <div className="mt-0.5 text-[11px] leading-4 text-slate-400">{node.detail}</div> : null}
        </div>
      </div>

      {hasChildren
        ? node.children!.map((child, index) => (
            <AgentBomTreeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              indexPath={`${indexPath}.${index + 1}`}
            />
          ))
        : null}
    </div>
  );
}

interface AgentBomBadgeProps {
  tree: AgentBomTreeNode[];
  versionLabel?: string;
  className?: string;
}

export function AgentBomBadge({ tree, versionLabel, className }: AgentBomBadgeProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-[4px] border border-violet-200 bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700 transition-colors hover:bg-violet-100",
            className
          )}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
        >
          <PackageSearch className="h-3 w-3" />
          Agent-BOM
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-[360px] rounded-md border-slate-200 p-0 shadow-lg"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <div className="border-b border-slate-100 px-4 py-3">
          <div className="text-sm font-semibold text-slate-950">Agent-BOM 物料清单</div>
          <div className="mt-1 text-xs leading-5 text-slate-500">
            基于资源完整性校验生成的有序资源快照{versionLabel ? ` · ${versionLabel}` : ""}
          </div>
        </div>
        <div className="max-h-[360px] overflow-y-auto px-4 py-2">
          {tree.map((node, index) => (
            <AgentBomTreeRow key={node.id} node={node} indexPath={String(index + 1)} />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
