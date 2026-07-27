"use client";

import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  RUN_STATUS_LABELS,
  type Run,
  type RunLogEventType,
} from "@/lib/mock/my-claw/collaboration";
import { RunStatusBadge } from "../shared/run-status-badge";
import { formatDateTime } from "../shared/format";
import { useCollaboration } from "../collaboration-provider";

const EVENT_COLORS: Record<RunLogEventType, string> = {
  agent: "bg-emerald-400",
  exec_command: "bg-sky-400",
  patch_apply: "bg-violet-400",
  output: "bg-slate-300",
};

const EVENT_LABELS: Record<RunLogEventType, string> = {
  agent: "agent",
  exec_command: "exec_command",
  patch_apply: "patch_apply",
  output: "output",
};

const TRIGGER_LABELS: Record<Run["triggerType"], string> = {
  assignment: "Assignment",
  mention: "Mention",
  rerun: "Rerun",
};

export interface ExecutionLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  runId: string | null;
  pastRunIds?: string[];
  onSelectRun?: (runId: string) => void;
}

export function ExecutionLogModal({
  open,
  onOpenChange,
  runId,
  pastRunIds = [],
  onSelectRun,
}: ExecutionLogModalProps) {
  const { state, executorLabel, getActor, advanceRun, rerun, cancelRun } =
    useCollaboration();
  const run = state.runs.find((item) => item.id === runId) ?? null;

  const segments = useMemo(() => {
    const events = run?.events ?? [];
    if (events.length === 0) {
      return [
        { type: "agent" as const, weight: 1 },
        { type: "exec_command" as const, weight: 1 },
        { type: "patch_apply" as const, weight: 1 },
      ];
    }
    const counts: Record<RunLogEventType, number> = {
      agent: 0,
      exec_command: 0,
      patch_apply: 0,
      output: 0,
    };
    for (const event of events) {
      counts[event.type] += 1;
    }
    return (Object.keys(counts) as RunLogEventType[])
      .filter((type) => counts[type] > 0)
      .map((type) => ({ type, weight: counts[type] }));
  }, [run?.events]);

  const totalWeight = segments.reduce((sum, item) => sum + item.weight, 0) || 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="shrink-0 border-b border-[#e7ecf0] px-6 py-4">
          <div className="flex flex-wrap items-center gap-2 pr-8">
            <DialogTitle className="text-base">Execution Log</DialogTitle>
            {run ? <RunStatusBadge status={run.status} /> : null}
          </div>
        </DialogHeader>

        {!run ? (
          <div className="px-6 py-16 text-center text-sm text-[#5a6779]">
            未找到该 Run
          </div>
        ) : (
          <>
            <div className="shrink-0 space-y-4 border-b border-[#e7ecf0] px-6 py-4">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[12px] sm:grid-cols-4">
                <Meta label="Run ID" value={run.id} mono />
                <Meta label="Trigger" value={TRIGGER_LABELS[run.triggerType]} />
                <Meta label="Executor" value={executorLabel(run.executor)} />
                <Meta
                  label="Status"
                  value={`Run ${RUN_STATUS_LABELS[run.status]}`}
                />
                <Meta
                  label="Started"
                  value={run.startedAt ? formatDateTime(run.startedAt) : "—"}
                />
                <Meta
                  label="Ended"
                  value={
                    run.completedAt ? formatDateTime(run.completedAt) : "—"
                  }
                />
              </div>

              <p className="text-[13px] leading-relaxed text-slate-700">
                {run.summary}
              </p>
              {run.errorMessage ? (
                <p className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-[12px] text-rose-700">
                  {run.errorMessage}
                </p>
              ) : null}

              <div>
                <div className="mb-1.5 flex flex-wrap gap-3 text-[11px] text-[#5a6779]">
                  {(Object.keys(EVENT_COLORS) as RunLogEventType[]).map(
                    (type) => (
                      <span key={type} className="inline-flex items-center gap-1.5">
                        <span
                          className={`h-2 w-2 rounded-sm ${EVENT_COLORS[type]}`}
                        />
                        {EVENT_LABELS[type]}
                      </span>
                    )
                  )}
                </div>
                <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-100">
                  {segments.map((segment) => (
                    <div
                      key={segment.type}
                      className={EVENT_COLORS[segment.type]}
                      style={{
                        width: `${(segment.weight / totalWeight) * 100}%`,
                      }}
                    />
                  ))}
                </div>
              </div>

              {run.tokenUsage ? (
                <div className="rounded-lg bg-[#f8f9fb] px-3 py-2 text-[12px] text-[#5a6779]">
                  Token usage · input {run.tokenUsage.input.toLocaleString()} ·
                  output {run.tokenUsage.output.toLocaleString()} · cache{" "}
                  {run.tokenUsage.cache.toLocaleString()} · runs{" "}
                  {run.tokenUsage.runs}
                </div>
              ) : null}

              {run.childRuns && run.childRuns.length > 0 ? (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-[#94a3b8]">
                    Child runs
                  </div>
                  {run.childRuns.map((child) => (
                    <div
                      key={child.actorId}
                      className="flex items-center justify-between rounded-lg border border-[#eef2f6] px-3 py-2"
                    >
                      <div>
                        <div className="text-[12px] font-medium text-slate-800">
                          {getActor(child.actorId)?.name ?? child.actorId}
                        </div>
                        <div className="text-[11px] text-[#5a6779]">
                          {child.summary}
                        </div>
                      </div>
                      <RunStatusBadge status={child.status} />
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {(run.status === "queued" || run.status === "running") && (
                  <Button
                    size="sm"
                    className="bg-[#2773ff] hover:bg-[#1f63e0]"
                    onClick={() => advanceRun(run.id)}
                  >
                    推进状态
                  </Button>
                )}
                {run.status === "failed" || run.status === "cancelled" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      rerun(run.id);
                    }}
                  >
                    重跑
                  </Button>
                ) : null}
                {run.status === "running" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => cancelRun(run.id)}
                  >
                    取消
                  </Button>
                ) : null}
                {run.status === "completed" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => rerun(run.id)}
                  >
                    重跑
                  </Button>
                ) : null}
              </div>

              {pastRunIds.length > 1 ? (
                <div>
                  <div className="mb-1.5 text-[11px] font-medium text-[#5a6779]">
                    Show past runs
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {pastRunIds.map((id, index) => {
                      const past = state.runs.find((item) => item.id === id);
                      if (!past) return null;
                      const active = id === run.id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => onSelectRun?.(id)}
                          className={`rounded-md border px-2 py-1 text-[11px] ${
                            active
                              ? "border-[#2773ff] bg-[#e8f0fb] text-[#2773ff]"
                              : "border-[#e7ecf0] bg-white text-[#5a6779] hover:bg-slate-50"
                          }`}
                        >
                          #{pastRunIds.length - index} · Run{" "}
                          {RUN_STATUS_LABELS[past.status]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
              {(run.events ?? []).length === 0 ? (
                <div className="py-10 text-center text-[13px] text-[#5a6779]">
                  暂无执行事件。可点击「推进状态」模拟执行。
                </div>
              ) : (
                <ol className="space-y-2">
                  {(run.events ?? []).map((event, index, list) => {
                    const isCurrentStep =
                      (run.status === "running" || run.status === "queued") &&
                      index === list.length - 1;
                    // Finished runs: all events expanded. Active runs: expand prior
                    // steps; leave the currently executing step collapsed by default.
                    const defaultOpen = !isCurrentStep;
                    return (
                      <li key={event.id} className="flex gap-3">
                        <div className="flex w-8 shrink-0 flex-col items-center">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f1f5f9] text-[11px] font-semibold text-[#5a6779]">
                            {event.index}
                          </span>
                          <div
                            className={`mt-1 h-2 w-2 rounded-sm ${EVENT_COLORS[event.type]}`}
                          />
                        </div>
                        <details
                          className="group min-w-0 flex-1 rounded-xl border border-[#eef2f6] bg-[#fafbfc]"
                          ref={(node) => {
                            if (node && defaultOpen) node.open = true;
                          }}
                        >
                          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 [&::-webkit-details-marker]:hidden">
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="text-[11px] font-medium uppercase tracking-wide text-[#94a3b8]">
                                {EVENT_LABELS[event.type]}
                              </span>
                              {isCurrentStep ? (
                                <span className="rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                                  执行中
                                </span>
                              ) : null}
                            </div>
                            <span className="shrink-0 text-[11px] text-[#94a3b8]">
                              {formatDateTime(event.timestamp)}
                            </span>
                          </summary>
                          <pre className="whitespace-pre-wrap break-words border-t border-[#eef2f6] px-3 py-2.5 font-mono text-[12px] leading-relaxed text-slate-700">
                            {event.content}
                          </pre>
                        </details>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Meta({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-[11px] text-[#94a3b8]">{label}</div>
      <div
        className={`mt-0.5 truncate text-slate-800 ${
          mono ? "font-mono text-[11px]" : "text-[12px] font-medium"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
