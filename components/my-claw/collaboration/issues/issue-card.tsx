"use client";

import Link from "next/link";
import { MessageSquare, Paperclip } from "lucide-react";
import type { Issue, Run } from "@/lib/mock/my-claw/collaboration";
import { ISSUE_PRIORITY_LABELS } from "@/lib/mock/my-claw/collaboration";
import { ActorAvatar } from "../shared/actor-avatar";
import { RunStatusBadge } from "../shared/run-status-badge";
import { formatRelativeTime } from "../shared/format";
import { useCollaboration } from "../collaboration-provider";

const PRIORITY_DOT: Record<Issue["priority"], string> = {
  urgent: "bg-rose-500",
  high: "bg-orange-400",
  medium: "bg-amber-400",
  low: "bg-slate-300",
};

export interface IssueCardProps {
  issue: Issue;
  href: string;
  projectName: string;
  latestRun?: Run;
}

export function IssueCard({
  issue,
  href,
  projectName,
  latestRun,
}: IssueCardProps) {
  const { getUser, executorLabel, getActor } = useCollaboration();
  const owner = getUser(issue.ownerUserId);
  const executorName = executorLabel(issue.executor);
  const executorType =
    issue.executor?.kind === "squad"
      ? "squad"
      : issue.executor?.kind === "agent"
        ? getActor(issue.executor.id)?.type
        : "human";
  const shortDesc =
    issue.description.length > 72
      ? `${issue.description.slice(0, 72)}…`
      : issue.description;

  return (
    <Link
      href={href}
      className="block rounded-xl border border-white/80 bg-white p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-shadow hover:shadow-[0_4px_12px_rgba(15,23,42,0.06)]"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] font-medium text-[#5a6779]">
          {issue.key}
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] text-[#5a6779]">
          <span
            className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[issue.priority]}`}
          />
          {ISSUE_PRIORITY_LABELS[issue.priority]}
        </span>
      </div>

      <h3 className="mb-1 line-clamp-2 text-[13px] font-semibold leading-snug text-slate-900">
        {issue.title}
      </h3>
      {shortDesc ? (
        <p className="mb-3 line-clamp-2 text-[12px] leading-relaxed text-[#5a6779]">
          {shortDesc}
        </p>
      ) : null}

      <div className="mb-3 flex flex-wrap gap-1.5">
        <span className="rounded-md bg-[#f1f5f9] px-1.5 py-0.5 text-[10px] font-medium text-[#5a6779]">
          {projectName}
        </span>
        {issue.executor ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-[#e8f0fb] px-1.5 py-0.5 text-[10px] font-medium text-[#2f5fbf]">
            <ActorAvatar
              name={executorName}
              type={executorType}
              size="sm"
              className="h-3.5 w-3.5 text-[8px]"
            />
            {executorName}
          </span>
        ) : (
          <span className="rounded-md bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-400">
            未指派
          </span>
        )}
        {latestRun ? <RunStatusBadge status={latestRun.status} /> : null}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-[#f1f5f9] pt-2.5">
        <div className="flex items-center gap-2 text-[11px] text-[#5a6779]">
          {owner ? (
            <ActorAvatar name={owner.name} type="human" size="sm" />
          ) : null}
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            {issue.commentIds.length}
          </span>
          <span className="inline-flex items-center gap-1">
            <Paperclip className="h-3 w-3" />
            {issue.artifactIds.length}
          </span>
        </div>
        <span className="text-[11px] text-[#94a3b8]">
          {formatRelativeTime(issue.updatedAt)}
        </span>
      </div>
    </Link>
  );
}
