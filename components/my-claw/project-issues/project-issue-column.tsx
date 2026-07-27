"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { BoardColumnId } from "@/lib/mock/my-claw/project-issues";
import { BOARD_COLUMN_LABELS } from "@/lib/mock/my-claw/project-issues";

const COLUMN_TINTS: Record<BoardColumnId, string> = {
  clarifying: "bg-slate-50/90",
  in_progress: "bg-orange-50/70",
  waiting: "bg-amber-50/60",
  in_review: "bg-emerald-50/60",
  done: "bg-blue-50/60",
  failed: "bg-rose-50/70",
};

const COLUMN_HEADER: Record<BoardColumnId, string> = {
  clarifying: "text-slate-700",
  in_progress: "text-orange-800",
  waiting: "text-amber-800",
  in_review: "text-emerald-800",
  done: "text-blue-800",
  failed: "text-rose-800",
};

interface ProjectIssueColumnProps {
  columnId: BoardColumnId;
  count: number;
  children: ReactNode;
}

export function ProjectIssueColumn({
  columnId,
  count,
  children,
}: ProjectIssueColumnProps) {
  return (
    <section
      className={cn(
        "flex min-h-0 w-[260px] shrink-0 flex-col rounded-xl border border-[#eef2f6]",
        COLUMN_TINTS[columnId]
      )}
    >
      <header className="flex items-center justify-between gap-2 px-3 py-2.5">
        <h3
          className={cn(
            "truncate text-[12px] font-semibold",
            COLUMN_HEADER[columnId]
          )}
        >
          {BOARD_COLUMN_LABELS[columnId]}
        </h3>
        <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[11px] font-medium text-[#5a6779]">
          {count}
        </span>
      </header>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-2.5 pb-3">
        {children}
      </div>
    </section>
  );
}
