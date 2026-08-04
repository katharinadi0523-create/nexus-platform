"use client";

import { useState } from "react";
import { Ban, Check, FileClock, MoreHorizontal, Power, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AgentRestoreIssue, AgentVersionAvailability, AgentVersionRecord } from "@/lib/mock/agent-version-management";
import { cn } from "@/lib/utils";

export interface RestoredAgentDraft {
  sourceLabel: string;
  issues: AgentRestoreIssue[];
}

interface AgentVersionHistoryDrawerProps {
  open: boolean;
  versions: AgentVersionRecord[];
  entityLabel: string;
  selectedVersionId: string | null;
  restoredDraft: RestoredAgentDraft | null;
  restoreConfirmOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectVersion: (versionId: string | null) => void;
  onRestoreRequest: () => void;
  onRestoreConfirmChange: (open: boolean) => void;
  onRestoreConfirm: () => void;
  onVersionAvailabilityChange: (versionId: string, status: AgentVersionAvailability) => void;
}

export function AgentVersionHistoryDrawer({
  open,
  versions,
  entityLabel,
  selectedVersionId,
  restoredDraft,
  restoreConfirmOpen,
  onOpenChange,
  onSelectVersion,
  onRestoreRequest,
  onRestoreConfirmChange,
  onRestoreConfirm,
  onVersionAvailabilityChange,
}: AgentVersionHistoryDrawerProps) {

  const [availabilityCandidateId, setAvailabilityCandidateId] = useState<string | null>(null);
  const [availabilityConfirmOpen, setAvailabilityConfirmOpen] = useState(false);
  const [lastAvailableBlockedOpen, setLastAvailableBlockedOpen] = useState(false);
  const selectedVersion = versions.find((version) => version.id === selectedVersionId) ?? null;
  const availabilityCandidate = versions.find((version) => version.id === availabilityCandidateId) ?? null;
  const availableVersionCount = versions.filter((version) => version.availabilityStatus === "启用").length;

  const requestAvailabilityChange = (versionId: string) => {
    const target = versions.find((version) => version.id === versionId);
    if (!target) return;
    setAvailabilityCandidateId(versionId);
    if (target.availabilityStatus === "启用" && availableVersionCount <= 1) {
      setLastAvailableBlockedOpen(true);
      return;
    }
    setAvailabilityConfirmOpen(true);
  };

  const confirmAvailabilityChange = () => {
    if (!availabilityCandidate) return;
    const nextStatus: AgentVersionAvailability = availabilityCandidate.availabilityStatus === "启用" ? "停用" : "启用";
    onVersionAvailabilityChange(availabilityCandidate.id, nextStatus);
    setAvailabilityConfirmOpen(false);
    setAvailabilityCandidateId(null);
  };

  return (
    <>
      <aside
        aria-label="版本历史"
        className={cn(
          "fixed bottom-0 right-0 top-20 z-40 flex w-[380px] flex-col border-l border-slate-200 bg-white shadow-[-18px_0_42px_-30px_rgba(15,23,42,0.35)] transition-transform duration-200",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-5">
          <div className="flex items-center gap-2.5">
            <FileClock className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-semibold text-slate-950">版本历史</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="关闭版本历史"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">

          <div className="relative space-y-3 before:absolute before:bottom-6 before:left-[9px] before:top-6 before:w-px before:bg-slate-200">
            {restoredDraft ? (
              <button
                type="button"
                onClick={() => onSelectVersion(null)}
                className={cn(
                  "relative ml-7 w-[calc(100%-1.75rem)] rounded-md border p-4 text-left transition-colors",
                  selectedVersionId === null
                    ? "border-blue-500 bg-blue-50/70"
                    : "border-amber-200 bg-amber-50/40 hover:border-amber-300"
                )}
              >
                <span
                  className={cn(
                    "absolute -left-[31px] top-5 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 bg-white",
                    selectedVersionId === null ? "border-blue-500" : "border-amber-300"
                  )}
                >
                  {selectedVersionId === null ? <span className="h-2 w-2 rounded-full bg-blue-500" /> : null}
                </span>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-slate-950">当前草稿</span>
                  <span
                    className={cn(
                      "rounded px-2 py-0.5 text-xs",
                      restoredDraft.issues.length ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700",
                    )}
                  >
                    {restoredDraft.issues.length ? `${restoredDraft.issues.length} \u9879\u5f85\u5904\u7406` : "\u7f16\u8f91\u4e2d"}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-600">
                  {restoredDraft.issues.length
                    ? `${restoredDraft.sourceLabel} \u5df2\u8fd8\u539f\u4e3a\u5f53\u524d\u8349\u7a3f\u3002${restoredDraft.issues.length} \u9879\u8d44\u6e90\u5f85\u5904\u7406\u3002`
                    : "\u5f53\u524d\u81ea\u52a8\u4fdd\u5b58\u8349\u7a3f\uff0c\u53d1\u5e03\u540e\u751f\u6210\u65b0\u7684\u7248\u672c\u8bb0\u5f55\u3002"}
                </p>
              </button>
            ) : null}

            {versions.map((version) => {
              const selected = version.id === selectedVersionId;
              return (
                <div
                  key={version.id}
                  className={cn(
                    "relative ml-7 w-[calc(100%-1.75rem)] rounded-md border transition-colors",
                    selected
                      ? "border-blue-500 bg-blue-50/70"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <span
                    className={cn(
                      "absolute -left-[31px] top-5 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 bg-white",
                      selected ? "border-blue-500" : "border-slate-300"
                    )}
                  >
                    {selected ? <span className="h-2 w-2 rounded-full bg-blue-500" /> : null}
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectVersion(version.id)}
                    className="w-full p-4 pr-11 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-950">{version.label}</span>
                      {version.isLatest ? (
                        <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs text-emerald-600">最新</span>
                      ) : null}
                      {version.availabilityStatus === "停用" ? (
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">已停用</span>
                      ) : null}
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-700">{version.description}</p>
                    <div className="mt-3 space-y-1 text-xs text-slate-500">
                      <p>{version.publisher} · {version.publishedAt}</p>
                      <p>版本 ID：{version.versionId}</p>
                    </div>
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`${version.label} 更多操作`}
                        className="absolute right-2 top-2 h-8 w-8 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36 rounded-md p-1">
                      <DropdownMenuItem
                        onSelect={() => requestAvailabilityChange(version.id)}
                        className="cursor-pointer rounded"
                      >
                        {version.availabilityStatus === "启用" ? <Ban className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                        {version.availabilityStatus === "启用" ? "停用版本" : "重新启用"}
                      </DropdownMenuItem>

                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>
        </div>

        {selectedVersion ? (
          <div className="shrink-0 border-t border-slate-200 bg-white p-4">
            <Button
              onClick={onRestoreRequest}
              className="h-10 w-full rounded-md bg-blue-600 text-white shadow-none hover:bg-blue-700"
            >
              <RotateCcw className="h-4 w-4" />
              还原为草稿
            </Button>
          </div>
        ) : null}
      </aside>

      <Dialog open={restoreConfirmOpen} onOpenChange={onRestoreConfirmChange}>
        <DialogContent className="max-w-[500px] rounded-lg">
          <DialogHeader>
            <DialogTitle>{"\u5c06"} {selectedVersion?.label} {"\u8fd8\u539f\u4e3a\u5f53\u524d\u8349\u7a3f\uff1f"}</DialogTitle>
            <DialogDescription className="pt-2 leading-6 text-slate-600">
              还原后将使用该版本内容覆盖当前草稿，当前未发布的修改将丢失。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => onRestoreConfirmChange(false)} className="rounded-md">{"\u53d6\u6d88"}</Button>
            <Button onClick={onRestoreConfirm} className="rounded-md bg-blue-600 text-white hover:bg-blue-700">
              <Check className="h-4 w-4" />
              {"\u786e\u8ba4\u8fd8\u539f"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={availabilityConfirmOpen} onOpenChange={setAvailabilityConfirmOpen}>
        <DialogContent className="max-w-[460px] rounded-lg">
          <DialogHeader>
            <DialogTitle>
              {availabilityCandidate?.availabilityStatus === "启用" ? `停用版本 ${availabilityCandidate?.label}？` : `重新启用版本 ${availabilityCandidate?.label}？`}
            </DialogTitle>
            <DialogDescription className="pt-2 leading-6 text-slate-600">
              {availabilityCandidate?.availabilityStatus === "启用"
                ? "停用后，该版本将不能被其他资源引用和调用；已发布版本及历史记录仍会保留。"
                : "启用后，该版本可重新被其他资源引用和调用。"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAvailabilityConfirmOpen(false)} className="rounded-md">取消</Button>
            <Button onClick={confirmAvailabilityChange} className="rounded-md bg-blue-600 text-white hover:bg-blue-700">
              {availabilityCandidate?.availabilityStatus === "启用" ? "确认停用" : "确认启用"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={lastAvailableBlockedOpen} onOpenChange={setLastAvailableBlockedOpen}>
        <DialogContent className="max-w-[460px] rounded-lg">
          <DialogHeader>
            <DialogTitle>该版本是最后一个可用版本</DialogTitle>
            <DialogDescription className="pt-2 leading-6 text-slate-600">
              当前版本不能单独停用。如需停止该对象被其他资源引用和调用，请停用{entityLabel}。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setLastAvailableBlockedOpen(false)} className="rounded-md bg-blue-600 text-white hover:bg-blue-700">我知道了</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
