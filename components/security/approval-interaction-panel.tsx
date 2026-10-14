"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
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
      <div className="shrink-0 border-b border-blue-100 bg-blue-50/90 px-6 py-3 text-sm text-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
              <Clock3 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{approvalLabel ?? "申请审批中"}</span>
                {requestId ? (
                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-slate-500 ring-1 ring-slate-200">
                    {requestId}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-slate-700">{summary ?? "申请已提交，等待审批结果。"}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                审批期间当前草稿暂时只读。
                {existingVersionContinues ? " 已发布版本可继续使用。" : ""}
                {submittedAt ? ` 提交于 ${submittedAt}` : ""}
              </p>
            </div>
          </div>

          <details className="group rounded-lg border border-blue-100 bg-white/70 text-xs text-slate-600">
            <summary className="flex cursor-pointer list-none items-center gap-1.5 px-3 py-2 font-medium hover:text-slate-900">
              原型演示
              <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
            </summary>
            <div className="border-t border-blue-100 p-2.5">
              <p className="mb-2 text-[11px] text-slate-400">仅用于演示审批结果，正式产品不展示</p>
              <div className="flex flex-wrap gap-1.5">
                <Button type="button" size="sm" className="h-7 bg-emerald-600 px-2.5 text-xs text-white hover:bg-emerald-700" onClick={onApprove}>
                  通过
                </Button>
                <Button type="button" size="sm" variant="outline" className="h-7 px-2.5 text-xs" onClick={onReject}>
                  驳回
                </Button>
                <Button type="button" size="sm" variant="outline" className="h-7 px-2.5 text-xs" onClick={onWithdraw}>
                  撤回
                </Button>
                <Button type="button" size="sm" variant="outline" className="h-7 border-rose-200 px-2.5 text-xs text-rose-700 hover:bg-rose-50" onClick={onWritebackFailure}>
                  同步失败
                </Button>
              </div>
            </div>
          </details>
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
                  {feedback.requestId}
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
              重试
            </Button>
          ) : null}
          {feedback.canTestDuplicate && onDuplicateCallback ? (
            <details className="group relative">
              <summary className="flex h-8 cursor-pointer list-none items-center gap-1 rounded-md border bg-white/75 px-2.5 text-xs font-medium">
                原型演示
                <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
              </summary>
              <div className="absolute right-0 top-10 z-20 w-52 rounded-lg border bg-white p-2 shadow-lg">
                <Button type="button" size="sm" variant="ghost" className="h-8 w-full justify-start text-xs" onClick={onDuplicateCallback}>
                  <RotateCcw className="h-3.5 w-3.5" />
                  模拟重复结果
                </Button>
              </div>
            </details>
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
