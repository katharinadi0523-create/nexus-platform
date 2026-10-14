"use client";

import {
  AlertTriangle,
  CheckCircle2,
  CircleX,
  Clock3,
  RefreshCcw,
  RotateCcw,
  ShieldAlert,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ApprovalFeedbackTone = "success" | "warning" | "danger" | "info";

export interface ApprovalFeedback {
  tone: ApprovalFeedbackTone;
  title: string;
  description: string;
  requestId?: string;
  canRetry?: boolean;
  canTestDuplicate?: boolean;
}

interface ApprovalInteractionPanelProps {
  pending: boolean;
  approvalLabel?: string;
  summary?: string;
  requestId?: string;
  submittedAt?: string;
  existingVersionContinues?: boolean;
  feedback?: ApprovalFeedback | null;
  onApprove: () => void;
  onReject: () => void;
  onWithdraw: () => void;
  onWritebackFailure: () => void;
  onRetry?: () => void;
  onDuplicateCallback?: () => void;
  onDismissFeedback?: () => void;
}

const FEEDBACK_STYLES: Record<
  ApprovalFeedbackTone,
  { wrapper: string; icon: typeof CheckCircle2 }
> = {
  success: {
    wrapper: "border-emerald-200 bg-emerald-50 text-emerald-950",
    icon: CheckCircle2,
  },
  warning: {
    wrapper: "border-amber-200 bg-amber-50 text-amber-950",
    icon: AlertTriangle,
  },
  danger: {
    wrapper: "border-rose-200 bg-rose-50 text-rose-950",
    icon: CircleX,
  },
  info: {
    wrapper: "border-blue-200 bg-blue-50 text-blue-950",
    icon: ShieldAlert,
  },
};

export function ApprovalInteractionPanel({
  pending,
  approvalLabel,
  summary,
  requestId,
  submittedAt,
  existingVersionContinues = false,
  feedback,
  onApprove,
  onReject,
  onWithdraw,
  onWritebackFailure,
  onRetry,
  onDuplicateCallback,
  onDismissFeedback,
}: ApprovalInteractionPanelProps) {
  if (pending) {
    return (
      <div className="shrink-0 border-b border-amber-200 bg-amber-50/95 px-6 py-3 text-sm text-amber-950">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Clock3 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{approvalLabel ?? "审批中"}</span>
                {requestId ? (
                  <span className="rounded-full border border-amber-200 bg-white/70 px-2 py-0.5 text-[11px] text-amber-800">
                    申请单 {requestId}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-amber-900">
                {summary ?? "等待基础管控平台回传结果。"}
                当前草稿保持只读，不能保存、发布、升密、停用、删除或还原版本。
                {existingVersionContinues ? " 已有发布版本继续按原状态运行。" : ""}
              </p>
              {submittedAt ? <p className="mt-1 text-xs text-amber-700">提交时间：{submittedAt}</p> : null}
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-amber-300 bg-white/65 p-2.5">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold text-amber-800">
              <ShieldAlert className="h-3.5 w-3.5" />
              原型验收 · 模拟 Base 回传
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Button type="button" size="sm" className="h-7 bg-emerald-600 px-2.5 text-xs text-white hover:bg-emerald-700" onClick={onApprove}>
                审批通过
              </Button>
              <Button type="button" size="sm" variant="outline" className="h-7 px-2.5 text-xs" onClick={onReject}>
                审批驳回
              </Button>
              <Button type="button" size="sm" variant="outline" className="h-7 px-2.5 text-xs" onClick={onWithdraw}>
                已撤回
              </Button>
              <Button type="button" size="sm" variant="outline" className="h-7 border-rose-200 px-2.5 text-xs text-rose-700 hover:bg-rose-50" onClick={onWritebackFailure}>
                回写失败
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!feedback) return null;
  const style = FEEDBACK_STYLES[feedback.tone];
  const FeedbackIcon = style.icon;

  return (
    <div className={cn("shrink-0 border-b px-6 py-3 text-sm", style.wrapper)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <FeedbackIcon className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{feedback.title}</span>
              {feedback.requestId ? (
                <span className="rounded-full border border-current/15 bg-white/60 px-2 py-0.5 text-[11px] opacity-80">
                  申请单 {feedback.requestId}
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 opacity-85">{feedback.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {feedback.canRetry && onRetry ? (
            <Button type="button" size="sm" variant="outline" className="h-8 bg-white/75" onClick={onRetry}>
              <RefreshCcw className="h-3.5 w-3.5" />
              重试结果同步
            </Button>
          ) : null}
          {feedback.canTestDuplicate && onDuplicateCallback ? (
            <Button type="button" size="sm" variant="outline" className="h-8 bg-white/75" onClick={onDuplicateCallback}>
              <RotateCcw className="h-3.5 w-3.5" />
              模拟重复回调
            </Button>
          ) : null}
          {onDismissFeedback ? (
            <Button type="button" size="icon" variant="ghost" className="h-8 w-8" aria-label="关闭状态提示" onClick={onDismissFeedback}>
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
