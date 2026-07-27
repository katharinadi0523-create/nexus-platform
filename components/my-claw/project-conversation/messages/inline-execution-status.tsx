"use client";

import { RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  deriveInlineStatuses,
  invocationStatusLabel,
  type ProjectMessage,
} from "@/lib/mock/my-claw/project-conversation";
import { useProjectConversation } from "../project-conversation-provider";
import { ActorAvatar } from "../shared/actor-avatar";

interface InlineExecutionStatusProps {
  message: ProjectMessage;
  className?: string;
}

export function InlineExecutionStatus({
  message,
  className,
}: InlineExecutionStatusProps) {
  const {
    state,
    getActor,
    openExecution,
    cancelInvocation,
  } = useProjectConversation();

  const views = deriveInlineStatuses(message, state.invocations);
  if (views.length === 0) return null;

  return (
    <div className={cn("mt-1.5 space-y-1", className)}>
      {views.map((view) => {
        const actor = getActor(view.actorId);
        const parts = [
          actor?.name ?? "Agent",
          invocationStatusLabel(view.status),
          view.durationLabel,
          view.delegationCount > 0
            ? `已委派 ${view.delegationCount} 个 Agent`
            : null,
          view.attemptNumber > 1 ? `第 ${view.attemptNumber} 次执行` : null,
          view.status === "failed" && view.errorMessage
            ? view.errorMessage
            : null,
        ].filter(Boolean);

        return (
          <div
            key={view.invocationId}
            className="group flex items-center gap-2 text-[12px] text-[#5a6779]"
          >
            <button
              type="button"
              onClick={() => openExecution(view.invocationId)}
              className="flex min-w-0 flex-1 items-center gap-1.5 rounded px-0.5 py-0.5 text-left transition-colors hover:bg-[#f8f9fb] hover:text-slate-700"
            >
              <ActorAvatar
                kind="agent"
                name={actor?.name ?? "Agent"}
                runtimeStatus={actor?.runtimeStatus}
                size="sm"
              />
              <span className="truncate">{parts.join(" · ")}</span>
            </button>

            {view.canCancel ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  cancelInvocation(view.invocationId);
                }}
                className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-[#5a6779] hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-3 w-3" />
                取消
              </button>
            ) : null}

            {view.canRetry ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openExecution(view.invocationId);
                }}
                className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-[#2773ff] hover:bg-[#e8f0fb]"
              >
                <RefreshCw className="h-3 w-3" />
                重试
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
