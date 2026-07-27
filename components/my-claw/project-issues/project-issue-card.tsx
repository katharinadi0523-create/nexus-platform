"use client";

import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectIssue } from "@/lib/mock/my-claw/project-issues";
import { useProjectConversation } from "@/components/my-claw/project-conversation/project-conversation-provider";
import { ActorAvatar } from "@/components/my-claw/project-conversation/shared/actor-avatar";
import { formatRelativeTime } from "./format";
import { IssueStatusBadge } from "./issue-status-badge";

interface ProjectIssueCardProps {
  issue: ProjectIssue;
  onOpen: (issueId: string) => void;
}

export function ProjectIssueCard({ issue, onOpen }: ProjectIssueCardProps) {
  const { getUser, getActor } = useProjectConversation();
  const isRework = issue.status === "changes_requested";

  return (
    <button
      type="button"
      onClick={() => onOpen(issue.id)}
      className={cn(
        "w-full rounded-xl border border-[#e2e8f0] bg-white p-3 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        "transition-colors hover:border-[#c9d7eb] hover:bg-[#fafbfd]"
      )}
    >
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[11px] font-medium text-[#5a6779]">
            {issue.key}
          </div>
          <h3 className="mt-0.5 line-clamp-2 text-[13px] font-semibold leading-5 text-slate-900">
            {issue.title}
          </h3>
        </div>
        <IssueStatusBadge status={issue.status} className="shrink-0" />
      </div>

      {issue.summary ? (
        <p className="mb-2 line-clamp-2 text-[12px] leading-4 text-[#5a6779]">
          {issue.summary}
        </p>
      ) : null}

      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        {issue.waitingForCurrentUser ? (
          <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
            等待我
          </span>
        ) : null}
        {isRework ? (
          <span className="rounded bg-orange-50 px-1.5 py-0.5 text-[10px] font-medium text-orange-700">
            返工
          </span>
        ) : null}
        {issue.artifactIds.length > 0 ? (
          <span className="inline-flex items-center gap-0.5 rounded bg-[#f8f9fb] px-1.5 py-0.5 text-[10px] text-[#5a6779]">
            <FileText className="h-3 w-3" />
            {issue.artifactIds.length}
          </span>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex -space-x-1.5">
          {issue.humanAssigneeIds.slice(0, 3).map((userId) => {
            const user = getUser(userId);
            if (!user) return null;
            return (
              <ActorAvatar
                key={userId}
                kind="human"
                name={user.name}
                initials={user.initials}
                size="sm"
                className="ring-1 ring-white"
              />
            );
          })}
          {issue.agentAssigneeIds.slice(0, 2).map((actorId) => {
            const actor = getActor(actorId);
            if (!actor) return null;
            return (
              <ActorAvatar
                key={actorId}
                kind="agent"
                name={actor.name}
                runtimeStatus={actor.runtimeStatus}
                size="sm"
                className="ring-1 ring-white"
              />
            );
          })}
        </div>
        <span className="shrink-0 text-[11px] text-[#5a6779]">
          {formatRelativeTime(issue.updatedAt)}
        </span>
      </div>
    </button>
  );
}
