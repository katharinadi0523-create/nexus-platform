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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  { trigger: string; icon: typeof CheckCircle2 }
> = {
  success: {
    trigger: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: CheckCircle2,
  },
  warning: {
    trigger: "border-amber-200 bg-amber-50 text-amber-700",
    icon: AlertTriangle,
  },
  danger: {
    trigger: "border-rose-200 bg-rose-50 text-rose-700",
    icon: CircleX,
  },
  info: {
    trigger: "border-blue-200 bg-blue-50 text-blue-700",
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
  if (!pending && !feedback) return null;

  const feedbackStyle = feedback ? FEEDBACK_STYLES[feedback.tone] : null;
  const StateIcon = pending ? Clock3 : feedbackStyle?.icon ?? ShieldAlert;
  const stateTitle = pending ? approvalLabel ?? "审批中" : feedback?.title ?? "状态更新";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-colors",
            pending
              ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
              : feedbackStyle?.trigger
          )}
        >
          <StateIcon className="h-3.5 w-3.5" />
          <span>{stateTitle}</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[420px] max-w-[calc(100vw-2rem)] p-0">
        <div className="border-b border-slate-100 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-slate-900">{stateTitle}</p>
                {requestId || feedback?.requestId ? (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
                    {requestId ?? feedback?.requestId}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                {pending ? summary ?? "申请已提交，等待审批结果。" : feedback?.description}
              </p>
            </div>
            {!pending && onDismissFeedback ? (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7 shrink-0"
                aria-label="关闭状态提示"
                onClick={onDismissFeedback}
              >
                <X className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </div>

        <div className="space-y-3 px-4 py-3">
          {pending ? (
            <>
              <div className="rounded-md bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
                审批期间当前草稿不可编辑、发布或执行其他受控操作。
                {existingVersionContinues ? " 已发布版本可继续使用。" : ""}
              </div>
              {submittedAt ? (
                <p className="text-xs text-slate-400">提交时间：{submittedAt}</p>
              ) : null}
              <details className="text-xs text-slate-400">
                <summary className="cursor-pointer select-none hover:text-slate-600">原型演示</summary>
                <div className="mt-2 rounded-md border border-dashed border-slate-200 bg-slate-50 p-2.5">
                  <p className="mb-2 text-[11px]">以下操作仅用于演示审批结果，正式产品不展示。</p>
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
                    <Button type="button" size="sm" variant="outline" className="h-7 border-rose-200 px-2.5 text-xs text-rose-700" onClick={onWritebackFailure}>
                      同步失败
                    </Button>
                  </div>
                </div>
              </details>
            </>
          ) : (
            <>
              {feedback?.canRetry && onRetry ? (
                <Button type="button" size="sm" variant="outline" className="h-8" onClick={onRetry}>
                  <RefreshCcw className="h-3.5 w-3.5" />
                  重试
                </Button>
              ) : null}
              {feedback?.canTestDuplicate && onDuplicateCallback ? (
                <details className="text-xs text-slate-400">
                  <summary className="cursor-pointer select-none hover:text-slate-600">原型演示</summary>
                  <Button type="button" size="sm" variant="ghost" className="mt-2 h-8 text-xs" onClick={onDuplicateCallback}>
                    <RotateCcw className="h-3.5 w-3.5" />
                    模拟重复结果
                  </Button>
                </details>
              ) : null}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
