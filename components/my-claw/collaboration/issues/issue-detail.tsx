"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, FileText } from "lucide-react";
import { IssueStatusBadge } from "../shared/issue-status-badge";
import { RunStatusBadge } from "../shared/run-status-badge";
import { useCollaboration } from "../collaboration-provider";
import { ExecutionLogModal } from "./execution-log-modal";
import { IssueCommentThread } from "./issue-comment-thread";
import { IssuePropertiesPanel } from "./issue-properties-panel";

export interface IssueDetailProps {
  workspaceId: string;
  projectId: string;
  issueId: string;
}

export function IssueDetail({
  workspaceId,
  projectId,
  issueId,
}: IssueDetailProps) {
  const {
    getIssue,
    getProject,
    getWorkspace,
    getCommentsForIssue,
    getRunsForIssue,
    getLatestRun,
    getArtifactsForProject,
  } = useCollaboration();

  const issue = getIssue(issueId);
  const project = getProject(projectId);
  const workspace = getWorkspace(workspaceId);
  const [runModalId, setRunModalId] = useState<string | null>(null);

  const comments = getCommentsForIssue(issueId);
  const runs = getRunsForIssue(issueId);
  const latestRun = getLatestRun(issueId);
  const artifacts = useMemo(
    () =>
      getArtifactsForProject(projectId).filter(
        (artifact) => artifact.issueId === issueId
      ),
    [getArtifactsForProject, issueId, projectId]
  );

  if (
    !workspace ||
    !project ||
    !issue ||
    issue.projectId !== projectId ||
    issue.workspaceId !== workspaceId
  ) {
    return (
      <div className="flex h-full items-center justify-center bg-[#f8f9fb]">
        <div className="text-center">
          <p className="text-sm font-medium text-slate-900">Issue 不存在</p>
          <p className="mt-1 text-[13px] text-[#5a6779]">
            该工作项可能属于其他项目，或 ID 无效
          </p>
          <Link
            href={`/my-claw/workspaces/${workspaceId}/projects/${projectId}/issues`}
            className="mt-3 inline-flex text-[13px] font-medium text-[#2773ff] hover:underline"
          >
            返回工作项列表
          </Link>
        </div>
      </div>
    );
  }

  const issuesBase = `/my-claw/workspaces/${workspaceId}/projects/${projectId}/issues`;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f8f9fb]">
      <div className="shrink-0 border-b border-[#e7ecf0] bg-white px-6 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={issuesBase}
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#5a6779] hover:text-[#2773ff]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            工作项
          </Link>
          <span className="font-mono text-[12px] text-[#94a3b8]">
            {issue.key}
          </span>
          <IssueStatusBadge status={issue.status} />
          {latestRun ? <RunStatusBadge status={latestRun.status} /> : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="mx-auto flex h-full max-w-[1200px]">
          <div className="min-w-0 flex-1 overflow-y-auto px-6 py-6">
            <div className="mx-auto max-w-[720px] space-y-8">
              <header>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                  {issue.title}
                </h1>
                <p className="mt-3 whitespace-pre-wrap text-[14px] leading-relaxed text-[#5a6779]">
                  {issue.description || "暂无描述"}
                </p>
              </header>

              <section>
                <h2 className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-slate-900">
                  <CheckCircle2 className="h-4 w-4 text-[#2773ff]" />
                  验收标准
                </h2>
                {issue.acceptanceCriteria.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#e2e8f0] px-4 py-6 text-[13px] text-[#5a6779]">
                    未设置验收标准
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {issue.acceptanceCriteria.map((criterion) => (
                      <li
                        key={criterion}
                        className="flex gap-2.5 rounded-lg border border-[#eef2f6] bg-white px-3 py-2.5 text-[13px] text-slate-700"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2773ff]" />
                        {criterion}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h2 className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-slate-900">
                  <FileText className="h-4 w-4 text-[#2773ff]" />
                  产物
                </h2>
                {artifacts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#e2e8f0] px-4 py-6 text-[13px] text-[#5a6779]">
                    暂无产物
                  </div>
                ) : (
                  <div className="space-y-2">
                    {artifacts.map((artifact) => (
                      <div
                        key={artifact.id}
                        className="flex items-center justify-between rounded-lg border border-[#eef2f6] bg-white px-3 py-2.5"
                      >
                        <div>
                          <div className="text-[13px] font-medium text-slate-800">
                            {artifact.name}
                          </div>
                          <div className="text-[11px] text-[#5a6779]">
                            {artifact.kind} · {artifact.createdByLabel}
                          </div>
                        </div>
                        {artifact.runId ? (
                          <button
                            type="button"
                            onClick={() => setRunModalId(artifact.runId!)}
                            className="text-[11px] font-medium text-[#2773ff] hover:underline"
                          >
                            关联 Run
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <IssueCommentThread
                issueId={issue.id}
                projectId={projectId}
                comments={comments}
                artifacts={artifacts}
                onOpenRun={setRunModalId}
              />
            </div>
          </div>

          <div className="hidden w-[320px] shrink-0 overflow-y-auto border-l border-[#e7ecf0] bg-white px-4 py-6 lg:block">
            <IssuePropertiesPanel
              issue={issue}
              runs={runs}
              onOpenRun={setRunModalId}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-[#e7ecf0] bg-white px-4 py-4 lg:hidden">
        <IssuePropertiesPanel
          issue={issue}
          runs={runs}
          onOpenRun={setRunModalId}
        />
      </div>

      <ExecutionLogModal
        open={Boolean(runModalId)}
        onOpenChange={(open) => {
          if (!open) setRunModalId(null);
        }}
        runId={runModalId}
        pastRunIds={runs.map((run) => run.id)}
        onSelectRun={setRunModalId}
      />
    </div>
  );
}
