"use client";

import { useMemo } from "react";
import {
  BOARD_COLUMNS,
  getBoardColumnForIssue,
  type BoardColumnId,
  type ProjectIssue,
} from "@/lib/mock/my-claw/project-issues";
import { useProjectConversation } from "@/components/my-claw/project-conversation/project-conversation-provider";
import { ProjectIssueCard } from "./project-issue-card";
import { ProjectIssueColumn } from "./project-issue-column";

interface ProjectIssueBoardProps {
  projectId: string;
  onOpenIssue: (issueId: string) => void;
}

export function ProjectIssueBoard({
  projectId,
  onOpenIssue,
}: ProjectIssueBoardProps) {
  const { getIssues, state } = useProjectConversation();
  const issues = getIssues(projectId);

  const columns = useMemo(() => {
    const map = new Map<BoardColumnId, ProjectIssue[]>();
    for (const column of BOARD_COLUMNS) {
      map.set(column, []);
    }
    for (const issue of issues) {
      const hasFailed = issue.invocationIds.some((id) => {
        const inv = state.invocations.find((item) => item.id === id);
        return inv?.status === "failed";
      });
      const column = getBoardColumnForIssue(issue, hasFailed);
      if (!column) continue;
      map.get(column)?.push(issue);
    }
    for (const [, list] of map) {
      list.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    }
    return map;
  }, [issues, state.invocations]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f8f9fb]">
      <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden px-4 py-4">
        <div className="flex h-full min-h-[420px] gap-3">
          {BOARD_COLUMNS.map((columnId) => {
            const list = columns.get(columnId) ?? [];
            return (
              <ProjectIssueColumn
                key={columnId}
                columnId={columnId}
                count={list.length}
              >
                {list.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[#e2e8f0] bg-white/50 px-2 py-6 text-center text-[11px] text-[#5a6779]">
                    暂无事项
                  </div>
                ) : (
                  list.map((issue) => (
                    <ProjectIssueCard
                      key={issue.id}
                      issue={issue}
                      onOpen={onOpenIssue}
                    />
                  ))
                )}
              </ProjectIssueColumn>
            );
          })}
        </div>
      </div>
    </div>
  );
}
