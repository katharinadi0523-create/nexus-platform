"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ISSUE_PRIORITY_LABELS,
  ISSUE_STATUS_LABELS,
  type ExecutorRef,
  type Issue,
  type IssuePriority,
  type IssueStatus,
  type Run,
  type RunLogEventType,
} from "@/lib/mock/my-claw/collaboration";
import { IssueStatusBadge } from "../shared/issue-status-badge";
import { RunStatusBadge } from "../shared/run-status-badge";
import { ActorAvatar } from "../shared/actor-avatar";
import { formatDateTime, formatRelativeTime } from "../shared/format";
import { useCollaboration } from "../collaboration-provider";
import { cn } from "@/lib/utils";

const EVENT_LABELS: Record<RunLogEventType, string> = {
  agent: "agent",
  exec_command: "exec_command",
  patch_apply: "patch_apply",
  output: "output",
};

const EVENT_PILL: Record<RunLogEventType, string> = {
  agent: "border-emerald-200 bg-emerald-50 text-emerald-700",
  exec_command: "border-sky-200 bg-sky-50 text-sky-700",
  patch_apply: "border-violet-200 bg-violet-50 text-violet-700",
  output: "border-slate-200 bg-slate-50 text-slate-600",
};

function isActiveRun(status: Run["status"]) {
  return status === "queued" || status === "running";
}

export interface IssuePropertiesPanelProps {
  issue: Issue;
  runs: Run[];
  onOpenRun: (runId: string) => void;
}

export function IssuePropertiesPanel({
  issue,
  runs,
  onOpenRun,
}: IssuePropertiesPanelProps) {
  const {
    getProject,
    getUser,
    getActor,
    getSquad,
    state,
    updateIssueStatus,
    assignIssue,
    approveIssue,
    rejectIssue,
    executorLabel,
  } = useCollaboration();
  const project = getProject(issue.projectId);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  /** Manual overrides; default: finished runs expanded, active runs collapsed. */
  const [expandOverrides, setExpandOverrides] = useState<Record<string, boolean>>(
    {}
  );

  const latestRun = runs[0];
  const finishedRuns = runs.filter((run) => !isActiveRun(run.status));
  const activeRuns = runs.filter((run) => isActiveRun(run.status));

  const isRunExpanded = (run: Run) => {
    if (Object.prototype.hasOwnProperty.call(expandOverrides, run.id)) {
      return expandOverrides[run.id];
    }
    return !isActiveRun(run.status);
  };

  const toggleRunExpanded = (runId: string, run: Run) => {
    setExpandOverrides((prev) => ({
      ...prev,
      [runId]: !(Object.prototype.hasOwnProperty.call(prev, runId)
        ? prev[runId]
        : !isActiveRun(run.status)),
    }));
  };

  const memberOptions = (project?.memberIds ?? []).map((id) => ({
    value: id,
    label: getUser(id)?.name ?? id,
  }));

  const actorOptions = (project?.actorIds ?? []).map((id) => ({
    value: `agent:${id}`,
    label: getActor(id)?.name ?? id,
  }));

  const squadOptions = state.squads
    .filter((squad) => squad.projectId === issue.projectId)
    .map((squad) => ({
      value: `squad:${squad.id}`,
      label: squad.name,
    }));

  const executorValue = issue.executor
    ? `${issue.executor.kind}:${issue.executor.id}`
    : "none";

  const executorOptions = [
    { value: "none", label: "未指派" },
    ...memberOptions.map((option) => ({
      value: `human:${option.value}`,
      label: `Human · ${option.label}`,
    })),
    ...actorOptions.map((option) => ({
      value: option.value,
      label: `Agent · ${option.label}`,
    })),
    ...squadOptions.map((option) => ({
      value: option.value,
      label: `Squad · ${option.label}`,
    })),
  ];

  const parseExecutor = (value: string): ExecutorRef | null => {
    if (value === "none") return null;
    const [kind, id] = value.split(":");
    if (
      (kind === "human" || kind === "agent" || kind === "squad") &&
      id
    ) {
      return { kind, id };
    }
    return null;
  };

  const handleApprove = () => {
    approveIssue(issue.id);
    toast.success("验收通过，Issue 已进入 Done");
  };

  const handleReject = () => {
    const reason = rejectReason.trim();
    if (!reason) {
      toast.error("请填写驳回原因");
      return;
    }
    rejectIssue(issue.id, reason);
    toast.success("已驳回，Issue 回到 In Progress");
    setRejectOpen(false);
    setRejectReason("");
  };

  return (
    <aside className="space-y-5">
      <section className="space-y-3">
        <SectionLabel>Status</SectionLabel>
        <div className="flex items-center gap-2">
          <IssueStatusBadge status={issue.status} />
        </div>
        <Select
          value={issue.status}
          onValueChange={(value) =>
            updateIssueStatus(issue.id, value as IssueStatus)
          }
          options={(Object.keys(ISSUE_STATUS_LABELS) as IssueStatus[]).map(
            (status) => ({
              value: status,
              label: ISSUE_STATUS_LABELS[status],
            })
          )}
        />
      </section>

      <section className="space-y-2">
        <SectionLabel>Priority</SectionLabel>
        <Select
          value={issue.priority}
          onValueChange={(value) =>
            assignIssue({
              issueId: issue.id,
              priority: value as IssuePriority,
            })
          }
          options={(Object.keys(ISSUE_PRIORITY_LABELS) as IssuePriority[]).map(
            (priority) => ({
              value: priority,
              label: ISSUE_PRIORITY_LABELS[priority],
            })
          )}
        />
      </section>

      <section className="space-y-2">
        <SectionLabel>Assignee / Owner</SectionLabel>
        <Select
          value={issue.ownerUserId}
          onValueChange={(value) =>
            assignIssue({ issueId: issue.id, ownerUserId: value })
          }
          options={memberOptions}
        />
        <PersonRow
          name={getUser(issue.ownerUserId)?.name ?? "—"}
          type="human"
        />
      </section>

      <section className="space-y-2">
        <SectionLabel>Executor</SectionLabel>
        <Select
          value={executorValue}
          onValueChange={(value) =>
            assignIssue({
              issueId: issue.id,
              executor: parseExecutor(value),
            })
          }
          options={executorOptions}
        />
        <PersonRow
          name={executorLabel(issue.executor)}
          type={
            issue.executor?.kind === "squad"
              ? "squad"
              : issue.executor?.kind === "agent"
                ? getActor(issue.executor.id)?.type
                : "human"
          }
        />
      </section>

      <section className="space-y-2">
        <SectionLabel>Reviewer</SectionLabel>
        <Select
          value={issue.reviewerUserId ?? "none"}
          onValueChange={(value) =>
            assignIssue({
              issueId: issue.id,
              reviewerUserId: value === "none" ? null : value,
            })
          }
          options={[
            { value: "none", label: "未指定" },
            ...memberOptions,
          ]}
        />
        {issue.reviewerUserId ? (
          <PersonRow
            name={getUser(issue.reviewerUserId)?.name ?? "—"}
            type="human"
          />
        ) : null}
      </section>

      <section className="space-y-2">
        <SectionLabel>Project</SectionLabel>
        <div className="rounded-lg border border-[#eef2f6] bg-[#f8f9fb] px-3 py-2 text-[13px] font-medium text-slate-800">
          {project?.name ?? "—"}
        </div>
      </section>

      <section className="space-y-2">
        <SectionLabel>Details</SectionLabel>
        <div className="space-y-1.5 text-[12px] text-[#5a6779]">
          <div className="flex justify-between gap-3">
            <span>Created</span>
            <span className="text-slate-700">
              {formatDateTime(issue.createdAt)}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span>Updated</span>
            <span className="text-slate-700">
              {formatRelativeTime(issue.updatedAt)}
            </span>
          </div>
          {issue.executor?.kind === "squad" ? (
            <div className="flex justify-between gap-3">
              <span>Squad</span>
              <span className="text-slate-700">
                {getSquad(issue.executor.id)?.name ?? "—"}
              </span>
            </div>
          ) : null}
        </div>
      </section>

      <section className="space-y-2">
        <SectionLabel>Execution Log</SectionLabel>
        {runs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#e2e8f0] px-3 py-4 text-center text-[12px] text-[#5a6779]">
            尚无 Run
          </div>
        ) : (
          <div className="space-y-2">
            {/* Finished runs: expanded by default with full event log */}
            {finishedRuns.map((run) => {
              const expanded = isRunExpanded(run);
              return (
                <div
                  key={run.id}
                  className="overflow-hidden rounded-xl border border-[#e7ecf0] bg-white"
                >
                  <div className="flex items-start gap-1">
                    <button
                      type="button"
                      onClick={() => toggleRunExpanded(run.id, run)}
                      className="mt-3 ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded text-[#5a6779] hover:bg-slate-50"
                      aria-label={expanded ? "收起" : "展开"}
                    >
                      {expanded ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenRun(run.id)}
                      className="min-w-0 flex-1 p-3 pl-1 text-left transition-colors hover:bg-[#f8fbff]"
                    >
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <span className="truncate font-mono text-[11px] text-[#5a6779]">
                          {run.id}
                        </span>
                        <RunStatusBadge status={run.status} />
                      </div>
                      <p className="line-clamp-2 text-[12px] text-slate-700">
                        {run.summary}
                      </p>
                      <p className="mt-1.5 text-[11px] text-[#94a3b8]">
                        {executorLabel(run.executor)} ·{" "}
                        {run.completedAt
                          ? formatRelativeTime(run.completedAt)
                          : run.startedAt
                            ? formatRelativeTime(run.startedAt)
                            : "—"}
                      </p>
                    </button>
                  </div>
                  {expanded ? (
                    <RunEventList events={run.events ?? []} defaultOpen />
                  ) : null}
                </div>
              );
            })}

            {/* Active runs: collapsed by default */}
            {activeRuns.map((run) => {
              const expanded = isRunExpanded(run);
              return (
                <div
                  key={run.id}
                  className="overflow-hidden rounded-xl border border-blue-100 bg-[#f8fbff]"
                >
                  <div className="flex items-start gap-1">
                    <button
                      type="button"
                      onClick={() => toggleRunExpanded(run.id, run)}
                      className="mt-3 ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded text-[#5a6779] hover:bg-white"
                      aria-label={expanded ? "收起" : "展开"}
                    >
                      {expanded ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenRun(run.id)}
                      className="min-w-0 flex-1 p-3 pl-1 text-left transition-colors hover:bg-white/70"
                    >
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <span className="truncate font-mono text-[11px] text-[#5a6779]">
                          {run.id}
                        </span>
                        <RunStatusBadge status={run.status} />
                      </div>
                      <p className="line-clamp-2 text-[12px] text-slate-700">
                        {run.summary}
                      </p>
                      <p className="mt-1.5 text-[11px] text-[#94a3b8]">
                        {executorLabel(run.executor)} · 执行中 · 点击查看完整日志
                      </p>
                    </button>
                  </div>
                  {expanded ? (
                    <RunEventList events={run.events ?? []} defaultOpen />
                  ) : null}
                </div>
              );
            })}

            {latestRun?.tokenUsage ? (
              <p className="px-1 text-[11px] text-[#5a6779]">
                Tokens · in {latestRun.tokenUsage.input.toLocaleString()} / out{" "}
                {latestRun.tokenUsage.output.toLocaleString()}
              </p>
            ) : null}
          </div>
        )}
      </section>

      {issue.status === "in_review" ? (
        <section className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3">
          <SectionLabel>验收</SectionLabel>
          <ul className="space-y-1.5">
            {issue.acceptanceCriteria.map((item) => (
              <li
                key={item}
                className="flex gap-2 text-[12px] text-slate-700"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                {item}
              </li>
            ))}
          </ul>
          {!rejectOpen ? (
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={handleApprove}
              >
                通过
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRejectOpen(true)}
              >
                驳回
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Textarea
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                placeholder="填写驳回原因（必填）"
                className="min-h-[72px] bg-white"
              />
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" onClick={handleReject}>
                  确认驳回
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setRejectOpen(false);
                    setRejectReason("");
                  }}
                >
                  取消
                </Button>
              </div>
            </div>
          )}
        </section>
      ) : null}
    </aside>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]">
      {children}
    </div>
  );
}

function PersonRow({
  name,
  type,
}: {
  name: string;
  type?: Parameters<typeof ActorAvatar>[0]["type"];
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-[#eef2f6] px-2.5 py-2">
      <ActorAvatar name={name} type={type} size="sm" />
      <span className="truncate text-[12px] text-slate-700">{name}</span>
    </div>
  );
}

function RunEventList({
  events,
  defaultOpen,
}: {
  events: NonNullable<Run["events"]>;
  defaultOpen: boolean;
}) {
  if (events.length === 0) {
    return (
      <div className="border-t border-[#eef2f6] px-3 py-2 text-[11px] text-[#94a3b8]">
        暂无执行事件
      </div>
    );
  }

  return (
    <div className="space-y-1.5 border-t border-[#eef2f6] bg-[#fafbfc] px-3 py-2.5">
      {events.map((event) => (
        <details
          key={event.id}
          className="group rounded-lg border border-[#eef2f6] bg-white"
          ref={(node) => {
            if (node && defaultOpen) node.open = true;
          }}
        >
          <summary className="flex cursor-pointer list-none items-center gap-2 px-2.5 py-1.5 [&::-webkit-details-marker]:hidden">
            <ChevronRight className="h-3 w-3 shrink-0 text-[#94a3b8] transition-transform group-open:rotate-90" />
            <span
              className={cn(
                "inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                EVENT_PILL[event.type]
              )}
            >
              {EVENT_LABELS[event.type]}
            </span>
            <span className="truncate text-[11px] text-[#5a6779]">
              #{event.index} · {formatDateTime(event.timestamp)}
            </span>
          </summary>
          <pre className="whitespace-pre-wrap break-words border-t border-[#eef2f6] px-2.5 py-2 font-mono text-[11px] leading-relaxed text-slate-700">
            {event.content}
          </pre>
        </details>
      ))}
    </div>
  );
}
