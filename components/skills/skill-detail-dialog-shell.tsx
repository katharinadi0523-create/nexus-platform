"use client";

import type { ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function SkillDetailDialogShell({
  open,
  onOpenChange,
  name,
  description,
  icon,
  badge,
  titleActions,
  headerActions,
  byline,
  stats,
  metadata,
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  description?: string;
  icon: ReactNode;
  badge?: ReactNode;
  titleActions?: ReactNode;
  headerActions?: ReactNode;
  byline?: ReactNode;
  stats?: Array<{ label: string; icon: ReactNode }>;
  metadata: Array<{ label: string; value: ReactNode }>;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="flex h-[min(760px,86vh)] max-h-[86vh] w-[min(800px,calc(100vw-32px))] max-w-none flex-col gap-0 overflow-hidden rounded-xl border-slate-200 p-0 sm:max-w-[800px]">
      <DialogHeader className="shrink-0 border-b border-slate-200 px-6 pb-5 pt-6 pr-12">
        <div className="flex items-start gap-4 text-left">
          <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">{icon}</div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <DialogTitle className="break-words text-xl font-semibold text-slate-900">{name}</DialogTitle>
              {badge ? <div className="flex flex-wrap items-center gap-2">{badge}</div> : null}
            </div>
            {titleActions ? <div className="mt-3 flex flex-wrap items-center gap-2">{titleActions}</div> : null}
            <DialogDescription className="mt-2 line-clamp-2 text-left text-sm leading-6 text-slate-600">{description || "暂无简介"}</DialogDescription>
            {byline ? <div className="mt-3 text-left text-xs text-slate-500">{byline}</div> : null}
          </div>
          {headerActions ? <div className="flex shrink-0 items-center gap-2">{headerActions}</div> : null}
        </div>
        {stats?.length ? <div className="mt-5 grid overflow-hidden rounded-md border border-slate-200 bg-white" style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}>
          {stats.map(({ label, icon }, index) => <div key={label} className={`flex min-h-16 flex-col items-center justify-center gap-1 px-2 py-2 text-center text-xs text-slate-600 ${index < stats.length - 1 ? "border-r border-slate-200" : ""}`}>
            <span className="text-slate-700">{icon}</span>
            <span>{label}</span>
          </div>)}
        </div> : null}
        {metadata.length ? <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-slate-100 pt-4 text-sm sm:grid-cols-3">
          {metadata.map(({ label, value }) => <div key={label} className="min-w-0"><dt className="text-xs text-slate-400">{label}</dt><dd className="mt-1 break-words font-medium text-slate-800">{value}</dd></div>)}
        </dl> : null}
      </DialogHeader>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
      {footer ? <DialogFooter className="shrink-0 flex-row items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">{footer}</DialogFooter> : null}
    </DialogContent>
  </Dialog>;
}
