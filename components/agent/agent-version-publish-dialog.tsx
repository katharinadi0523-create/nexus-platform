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
import { SecurityLevelBadge } from "@/components/security/security-level-badge";
import { isHighSecurityLevel, type SecurityLevel } from "@/lib/security-level";

interface AgentVersionPublishDialogProps {
  open: boolean;
  entityLabel: string;
  versionLabel: string;
  securityLevel: SecurityLevel;
  approvalKind: "create" | "publish";
  description: string;
  approvalReason: string;
  onOpenChange: (open: boolean) => void;
  onDescriptionChange: (description: string) => void;
  onApprovalReasonChange: (reason: string) => void;
  onConfirm: () => void;
}

export function AgentVersionPublishDialog({
  open,
  entityLabel,
  versionLabel,
  securityLevel,
  approvalKind,
  description,
  approvalReason,
  onOpenChange,
  onDescriptionChange,
  onApprovalReasonChange,
  onConfirm,
}: AgentVersionPublishDialogProps) {
  const requiresApproval = isHighSecurityLevel(securityLevel);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100vh-32px)] max-w-[560px] flex-col gap-0 overflow-hidden rounded-lg p-0">
        <DialogHeader className="shrink-0 border-b border-slate-200 px-5 py-4">
          <DialogTitle>
            {requiresApproval && approvalKind === "create"
              ? `提交${entityLabel}创建申请`
              : entityLabel === "Claw" ? "发布 Claw" : `发布${entityLabel}`}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {approvalKind === "create" ? "填写高密资源创建申请" : "确认版本号并填写本次发布说明"}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-800">版本号</label>
            <div className="flex h-11 items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3">
              <span className="text-sm font-semibold text-slate-900">{versionLabel}</span>
              <span className="text-xs text-slate-500">系统自动递增，不可修改</span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5">
            <div>
              <p className="text-sm font-medium text-slate-800">资源密级</p>
              <p className="mt-1 text-xs text-slate-500">新版本沿用资源当前密级，不单独设置。</p>
            </div>
            <SecurityLevelBadge level={securityLevel} />
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
                rows={4}
                onChange={(event) => onDescriptionChange(event.target.value)}
                placeholder="请说明本次发布的主要变更，例如：调整成员智能体、更新知识库、优化角色指令……"
                className="w-full resize-none rounded-md border border-slate-300 bg-white px-3 py-2.5 pb-8 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <span className="absolute bottom-2.5 right-3 text-xs text-slate-400">{description.length}/500</span>
            </div>
          </div>

          {requiresApproval && (
            <div className="space-y-2">
              <label htmlFor="entity-publish-approval-reason" className="text-sm font-medium text-slate-800">
                <span className="mr-1 text-rose-500">*</span>申请原因
              </label>
              <div className="relative">
                <textarea
                  id="entity-publish-approval-reason"
                  aria-label="申请原因"
                  value={approvalReason}
                  maxLength={500}
                  rows={3}
                  onChange={(event) => onApprovalReasonChange(event.target.value)}
                  placeholder={`请说明${approvalKind === "create" ? "创建" : "发布"}该高密资源的业务原因、使用场景和必要性`}
                  className="w-full resize-none rounded-md border border-slate-300 bg-white px-3 py-2.5 pb-8 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <span className="absolute bottom-2.5 right-3 text-xs text-slate-400">{approvalReason.length}/500</span>
              </div>
              <p className="text-xs text-slate-400">
                该内容将随{approvalKind === "create" ? "创建" : "发布"}申请提交给审批人，不写入版本记录。
              </p>
            </div>
          )}

          <div className={requiresApproval
            ? "rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-800"
            : "rounded-md bg-blue-50 px-3 py-2.5 text-xs leading-5 text-blue-800"
          }>
            {requiresApproval
              ? approvalKind === "create"
                ? `当前资源为${securityLevel}。版本描述用于记录初始配置，申请原因将用于创建审批；审批通过后方可进入配置或使用。`
                : `当前资源为${securityLevel}。版本描述将写入版本记录，申请原因将用于发布审批；审批通过后生成 ${versionLabel}。`
              : `发布成功后将生成新的版本记录，并固化本次发布的版本组成。当前草稿内容将作为 ${versionLabel} 上线。`}
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t border-slate-200 bg-white px-5 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-md">取消</Button>
          <Button
            disabled={!description.trim() || (requiresApproval && !approvalReason.trim())}
            onClick={onConfirm}
            className="rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300"
          >
            {requiresApproval
              ? approvalKind === "create" ? "提交创建申请" : "提交发布申请"
              : "确认发布"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
