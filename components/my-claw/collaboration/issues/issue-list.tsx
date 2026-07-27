"use client";

import Link from "next/link";
import {
  ISSUE_PRIORITY_LABELS,
  type Issue,
  type Run,
} from "@/lib/mock/my-claw/collaboration";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IssueStatusBadge } from "../shared/issue-status-badge";
import { RunStatusBadge } from "../shared/run-status-badge";
import { ActorAvatar } from "../shared/actor-avatar";
import { formatRelativeTime } from "../shared/format";
import { useCollaboration } from "../collaboration-provider";

export interface IssueListProps {
  issues: Issue[];
  workspaceId: string;
  projectId: string;
  getLatestRun: (issueId: string) => Run | undefined;
}

export function IssueList({
  issues,
  workspaceId,
  projectId,
  getLatestRun,
}: IssueListProps) {
  const { getUser, executorLabel, getActor } = useCollaboration();

  if (issues.length === 0) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-dashed border-[#e2e8f0] bg-white">
        <div className="text-center">
          <p className="text-sm font-medium text-slate-900">暂无匹配的工作项</p>
          <p className="mt-1 text-[13px] text-[#5a6779]">
            调整筛选条件，或新建 Issue
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#e7ecf0] bg-white">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[88px] text-[12px] text-[#5a6779]">
              Key
            </TableHead>
            <TableHead className="text-[12px] text-[#5a6779]">Title</TableHead>
            <TableHead className="w-[120px] text-[12px] text-[#5a6779]">
              Issue status
            </TableHead>
            <TableHead className="w-[72px] text-[12px] text-[#5a6779]">
              Priority
            </TableHead>
            <TableHead className="w-[120px] text-[12px] text-[#5a6779]">
              Owner
            </TableHead>
            <TableHead className="w-[140px] text-[12px] text-[#5a6779]">
              Executor
            </TableHead>
            <TableHead className="w-[140px] text-[12px] text-[#5a6779]">
              Latest Run
            </TableHead>
            <TableHead className="w-[100px] text-right text-[12px] text-[#5a6779]">
              Updated
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {issues.map((issue) => {
            const owner = getUser(issue.ownerUserId);
            const latestRun = getLatestRun(issue.id);
            const executorName = executorLabel(issue.executor);
            const executorType =
              issue.executor?.kind === "squad"
                ? "squad"
                : issue.executor?.kind === "agent"
                  ? getActor(issue.executor.id)?.type
                  : "human";
            const href = `/my-claw/workspaces/${workspaceId}/projects/${projectId}/issues/${issue.id}`;

            return (
              <TableRow key={issue.id} className="group">
                <TableCell>
                  <Link
                    href={href}
                    className="font-mono text-[12px] font-medium text-[#2773ff] hover:underline"
                  >
                    {issue.key}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link
                    href={href}
                    className="line-clamp-1 text-[13px] font-medium text-slate-900 group-hover:text-[#2773ff]"
                  >
                    {issue.title}
                  </Link>
                </TableCell>
                <TableCell>
                  <IssueStatusBadge status={issue.status} />
                </TableCell>
                <TableCell className="text-[12px] text-[#5a6779]">
                  {ISSUE_PRIORITY_LABELS[issue.priority]}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {owner ? (
                      <ActorAvatar name={owner.name} type="human" size="sm" />
                    ) : null}
                    <span className="truncate text-[12px] text-slate-700">
                      {owner?.name ?? "—"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {issue.executor ? (
                      <ActorAvatar
                        name={executorName}
                        type={executorType}
                        size="sm"
                      />
                    ) : null}
                    <span className="truncate text-[12px] text-slate-700">
                      {executorName}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {latestRun ? (
                    <RunStatusBadge status={latestRun.status} />
                  ) : (
                    <span className="text-[12px] text-slate-400">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right text-[12px] text-[#5a6779]">
                  {formatRelativeTime(issue.updatedAt)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
