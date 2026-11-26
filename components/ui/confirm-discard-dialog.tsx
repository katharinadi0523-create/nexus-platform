"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const DISCARD_CONFIRMATION_DESCRIPTION = "继续后，当前填写的内容将不会保留。是否继续？";

export function ConfirmDiscardDialog({
  open,
  onOpenChange,
  onConfirm,
  description = DISCARD_CONFIRMATION_DESCRIPTION,
  confirmLabel = "放弃更改",
  title = "确认放弃未保存内容？",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  description?: string;
  confirmLabel?: string;
  title?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 rounded-lg border-slate-200 p-0 sm:max-w-[360px]" showCloseButton={false}>
        <DialogHeader className="px-5 pt-5">
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <AlertCircle className="size-4 shrink-0 fill-amber-500 text-white" aria-hidden="true" />
            {title}
          </DialogTitle>
          <DialogDescription className="pl-6 pt-1 text-xs leading-5 text-slate-600">{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="px-5 py-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="h-8 rounded-[4px] px-3 text-xs" onClick={() => onOpenChange(false)}>继续编辑</Button>
          <Button type="button" className="h-8 rounded-[4px] bg-[#2773ff] px-3 text-xs text-white hover:bg-[#1f63e0]" onClick={onConfirm}>{confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
