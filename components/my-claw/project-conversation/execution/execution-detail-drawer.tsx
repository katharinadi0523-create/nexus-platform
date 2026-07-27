"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  formatDurationLabel,
  invocationStatusLabel,
} from "@/lib/mock/my-claw/project-conversation";
import { useProjectConversation } from "../project-conversation-provider";
import { DrawerShell } from "../shared/drawer-shell";
import { ActorAvatar } from "../shared/actor-avatar";
import { DelegationTree } from "./delegation-tree";
import { ExecutionTimeline } from "./execution-timeline";
import { RetryInvocationDialog } from "./retry-invocation-dialog";

interface ExecutionDetailDrawerProps {
  invocationId: string;
  onClose: () => void;
}

export function ExecutionDetailDrawer({
  invocationId,
  onClose,
}: ExecutionDetailDrawerProps) {
  const {
    getInvocation,
    getActor,
    getEvents,
    getDelegations,
    getSession,
    cancelInvocation,
    retryInvocation,
    restoreActorOnline,
    openExecution,
  } = useProjectConversation();

  const [retryOpen, setRetryOpen] = useState(false);
  const invocation = getInvocation(invocationId);

  if (!invocation) {
    return (
      <DrawerShell title="执行详情" onClose={onClose}>
        <p className="text-[13px] text-[#5a6779]">执行记录不存在或已失效</p>
      </DrawerShell>
    );
  }

  const actor = getActor(invocation.actorId);
  const events = getEvents(invocation.id);
  const delegations = getDelegations(invocation.id);
  const session = getSession(invocation.sessionId);
  const canCancel =
    invocation.status === "queued" || invocation.status === "running";
  const canRetry =
    invocation.status === "failed" || invocation.status === "cancelled";
  const duration = formatDurationLabel(
    invocation.startedAt,
    invocation.completedAt
  );

  return (
    <>
      <DrawerShell
        title="执行详情"
        onClose={onClose}
        footer={
          <div className="flex flex-wrap gap-2">
            {canCancel ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => cancelInvocation(invocation.id)}
              >
                取消执行
              </Button>
            ) : null}
            {canRetry ? (
              <Button
                type="button"
                size="sm"
                className="bg-[#2773ff] hover:bg-[#1f63e0]"
                onClick={() => setRetryOpen(true)}
              >
                重试
              </Button>
            ) : null}
            {actor?.runtimeStatus === "offline" ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => restoreActorOnline(actor.id)}
              >
                模拟恢复在线
              </Button>
            ) : null}
          </div>
        }
      >
        <section className="mb-5">
          <div className="mb-3 flex items-center gap-2">
            <ActorAvatar
              kind="agent"
              name={actor?.name ?? "Agent"}
              runtimeStatus={actor?.runtimeStatus}
              size="md"
            />
            <div className="min-w-0">
              <div className="truncate text-[14px] font-semibold text-slate-900">
                {actor?.name ?? "Agent"}
              </div>
              <div className="text-[12px] text-[#5a6779]">
                {invocationStatusLabel(invocation.status)}
                {duration ? ` · ${duration}` : ""}
                {invocation.attemptNumber > 1
                  ? ` · 第 ${invocation.attemptNumber} 次执行`
                  : ""}
              </div>
            </div>
          </div>

          <dl className="space-y-2 rounded-lg bg-[#f8f9fb] px-3 py-2.5 text-[12px]">
            <div className="flex justify-between gap-3">
              <dt className="text-[#5a6779]">摘要</dt>
              <dd className="text-right text-slate-700">
                {invocation.summary || "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[#5a6779]">Session</dt>
              <dd className="truncate text-right text-slate-700">
                {session?.lastSummary ?? session?.id ?? "—"}
              </dd>
            </div>
            {invocation.errorMessage ? (
              <div className="flex justify-between gap-3">
                <dt className="text-[#5a6779]">错误</dt>
                <dd className="text-right text-red-600">
                  {invocation.errorMessage}
                </dd>
              </div>
            ) : null}
          </dl>
        </section>

        <section className="mb-5">
          <div className="mb-2 flex items-end justify-between gap-2">
            <h3 className="text-[13px] font-semibold text-slate-800">
              执行时间线
            </h3>
            <span className="text-[11px] text-[#5a6779]">
              Agent Session 审计视图 · 不可在此回复
            </span>
          </div>
          <ExecutionTimeline
            events={events}
            onOpenDelegatedInvocation={(id) => {
              // Switch drawer content to child invocation audit
              openExecution(id);
            }}
          />
        </section>

        <section>
          <h3 className="mb-2 text-[13px] font-semibold text-slate-800">
            委派
          </h3>
          <DelegationTree delegations={delegations} />
        </section>
      </DrawerShell>

      <RetryInvocationDialog
        open={retryOpen}
        onOpenChange={setRetryOpen}
        agentName={actor?.name}
        onConfirm={(policy) => retryInvocation(invocation.id, policy)}
      />
    </>
  );
}
