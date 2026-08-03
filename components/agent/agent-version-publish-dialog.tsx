"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AgentVersionPublishDialogProps {
  open: boolean;
  entityLabel: string;
  versionLabel: string;
  description: string;
  onOpenChange: (open: boolean) => void;
  onDescriptionChange: (description: string) => void;
  onConfirm: () => void;
}

export function AgentVersionPublishDialog({
  open,
  entityLabel,
  versionLabel,
  description,
  onOpenChange,
  onDescriptionChange,
  onConfirm,
}: AgentVersionPublishDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[520px] gap-0 overflow-hidden rounded-lg p-0">
        <DialogHeader className="border-b border-slate-200 px-5 py-4">
          <DialogTitle>{entityLabel === "Claw" ? "发布 Claw" : `发布${entityLabel}`}</DialogTitle>
          <DialogDescription className="sr-only">确认版本号并填写本次发布说明</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-5 py-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-800">版本号</label>
            <div className="flex h-11 items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3">
              <span className="text-sm font-semibold text-slate-900">{versionLabel}</span>
              <span className="text-xs text-slate-500">系统自动递增，不可修改</span>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="entity-version-description" className="text-sm font-medium text-slate-800">
              <span className="mr-1 text-rose-500">*</span>版本描述
            </label>
            <div className="relative">
              <textarea
                id="entity-version-description"
                aria-label="版本描述"
                value={description}
                maxLength={500}
                rows={5}
                onChange={(event) => onDescriptionChange(event.target.value)}
                placeholder="请说明本次发布的主要变更，例如：调整成员智能体、更新知识库、优化角色指令……"
                className="w-full resize-none rounded-md border border-slate-300 bg-white px-3 py-2.5 pb-8 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <span className="absolute bottom-2.5 right-3 text-xs text-slate-400">{description.length}/500</span>
            </div>
          </div>

          <div className="rounded-md bg-blue-50 px-3 py-2.5 text-xs leading-5 text-blue-800">
            发布成功后将生成新的版本记录，并固化本次发布的版本组成。当前草稿内容将作为 {versionLabel} 上线。
          </div>
        </div>

        <DialogFooter className="border-t border-slate-200 px-5 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-md">取消</Button>
          <Button
            disabled={!description.trim()}
            onClick={onConfirm}
            className="rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300"
          >
            确认发布
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}