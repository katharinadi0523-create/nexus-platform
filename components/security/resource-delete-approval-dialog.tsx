"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SecurityLevelBadge } from "@/components/security/security-level-badge";
import type { SecurityLevel } from "@/lib/security-level";

interface ResourceDeleteApprovalDialogProps {
  open: boolean;
  resourceName: string;
  resourceType: string;
  securityLevel: SecurityLevel;
  reason: string;
  impactDescription: string;
  onOpenChange: (open: boolean) => void;
  onReasonChange: (reason: string) => void;
  onSubmit: () => void;
}

export function ResourceDeleteApprovalDialog({
  open,
  resourceName,
  resourceType,
  securityLevel,
  reason,
  impactDescription,
  onOpenChange,
  onReasonChange,
  onSubmit,
}: ResourceDeleteApprovalDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>申请删除资源</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p>
              删除申请提交后，审批通过前资源保持当前状态；审批通过后将永久删除，且无法恢复。
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 px-4 py-3">
            <dl className="grid grid-cols-[88px_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm">
              <dt className="text-slate-500">资源名称</dt>
              <dd className="truncate font-medium text-slate-900">{resourceName}</dd>
              <dt className="text-slate-500">资源类型</dt>
              <dd className="text-slate-900">{resourceType}</dd>
              <dt className="text-slate-500">当前密级</dt>
              <dd>
                <SecurityLevelBadge level={securityLevel} />
              </dd>
            </dl>
          </div>

          <div className="rounded-lg border border-slate-200 px-4 py-3">
            <p className="text-sm font-medium text-slate-900">删除影响</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">{impactDescription}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="resource-delete-approval-reason">
              <span className="text-rose-500">*</span>申请原因
            </Label>
            <Textarea
              id="resource-delete-approval-reason"
              value={reason}
              onChange={(event) => onReasonChange(event.target.value)}
              rows={4}
              maxLength={200}
              placeholder="请说明删除该资源的原因"
              className="resize-none"
            />
            <div className="text-right text-xs text-slate-400">{reason.length}/200</div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            type="button"
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={onSubmit}
          >
            提交审批
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
