"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { InboxItem } from "@/lib/mock/my-claw/collaboration";
import { INBOX_SESSION_THREADS } from "@/lib/mock/my-claw/collaboration/inbox";
import { useCollaboration } from "../collaboration-provider";
import { ActorAvatar } from "../shared/actor-avatar";
import { IssueStatusBadge } from "../shared/issue-status-badge";
import { RunStatusBadge } from "../shared/run-status-badge";
import { formatDateTime, formatRelativeTime } from "../shared/format";
import { IssueCommentThread } from "../issues/issue-comment-thread";
import { ExecutionLogModal } from "../issues/execution-log-modal";
import { cn } from "@/lib/utils";

export function InboxDetail({ item }: { item: InboxItem }) {
  if (item.source.kind === "session") {
    return <SessionDeliveryDetail item={item} />;
  }
  if (item.source.kind === "personal") {
    return <PersonalNoticeDetail item={item} />;
  }
  if (item.source.issueId) {
    return <IssueInboxDetail item={item} />;
  }
  return <ProjectNoticeDetail item={item} />;
}

function IssueInboxDetail({ item }: { item: InboxItem }) {
  const {
    getIssue,
    getProject,
    getCommentsForIssue,
    getRunsForIssue,
    getArtifactsForProject,
    getLatestRun,
    approveIssue,
    rejectIssue,
    acceptSquadInvitation,
    executorLabel,
  } = useCollaboration();

  const source = item.source.kind === "project" ? item.source : null;
  const issueId = source?.issueId;
  const issue = issueId ? getIssue(issueId) : undefined;
  const project = source ? getProject(source.projectId) : undefined;
  const comments = issueId ? getCommentsForIssue(issueId) : [];
  const runs = issueId ? getRunsForIssue(issueId) : [];
  const latestRun = issueId ? getLatestRun(issueId) : undefined;
  const artifacts = useMemo(
    () =>
      source && issueId
        ? getArtifactsForProject(source.projectId).filter(
            (artifact) => artifact.issueId === issueId
          )
        : [],
    [getArtifactsForProject, issueId, source]
  );
  const [runModalId, setRunModalId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const focusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      focusRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [item.id, item.focusCommentId]);

  if (!source || !issueId) return null;

  if (!issue || !project) {
    return (
      <EmptyDetail
        title="目标已归档或不可访问"
        description="该 Issue 可能已被删除或你没有访问权限。"
      />
    );
  }

  const issueHref = `/my-claw/workspaces/${source.workspaceId}/projects/${source.projectId}/issues/${issue.id}`;
  const needsReview =
    item.type === "review_requested" || issue.status === "in_review";

  return (
    <div className="flex h-full min-h-0">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="shrink-0 border-b border-[#eef2f6] bg-white px-5 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0 text-[12px] text-[#5a6779]">
              <span>{project.name}</span>
              <span className="mx-1.5 text-[#cbd5e1]">›</span>
              <span className="font-mono">{issue.key}</span>
              <span className="mx-1.5 text-[#cbd5e1]">·</span>
              <span className="truncate text-slate-800">{issue.title}</span>
            </div>
            <Link
              href={issueHref}
              className="inline-flex items-center gap-1 text-[12px] font-medium text-[#2773ff] hover:underline"
            >
              打开完整 Issue
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <IssueStatusBadge status={issue.status} />
            {latestRun ? <RunStatusBadge status={latestRun.status} /> : null}
            {needsReview ? (
              <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                待你 Review
              </span>
            ) : null}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <div className="mx-auto max-w-[720px] space-y-5">
            <section>
              <h1 className="text-xl font-semibold text-slate-900">
                {issue.title}
              </h1>
              <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-[#5a6779]">
                {issue.description}
              </p>
            </section>

            {needsReview ? (
              <div
                ref={focusRef}
                className="rounded-xl border border-amber-200 bg-amber-50/80 p-4"
              >
                <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-amber-900">
                  <CheckCircle2 className="h-4 w-4" />
                  待你验收
                </div>
                <ul className="mb-3 space-y-1.5">
                  {issue.acceptanceCriteria.map((criterion) => (
                    <li
                      key={criterion}
                      className="flex gap-2 text-[12px] text-slate-700"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                      {criterion}
                    </li>
                  ))}
                </ul>
                {artifacts.length > 0 ? (
                  <div className="mb-3 space-y-1.5">
                    {artifacts.map((artifact) => (
                      <div
                        key={artifact.id}
                        className="flex items-center gap-2 rounded-lg border border-amber-100 bg-white px-3 py-2 text-[12px]"
                      >
                        <FileText className="h-3.5 w-3.5 text-[#2773ff]" />
                        <span className="font-medium text-slate-800">
                          {artifact.name}
                        </span>
                        <span className="text-[#94a3b8]">
                          · {artifact.createdByLabel}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
                {!rejectOpen ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => {
                        approveIssue(issue.id);
                        toast.success("验收通过");
                      }}
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
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="填写驳回原因"
                      className="min-h-[72px] bg-white"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (!rejectReason.trim()) {
                            toast.error("请填写驳回原因");
                            return;
                          }
                          rejectIssue(issue.id, rejectReason.trim());
                          toast.success("已驳回");
                          setRejectOpen(false);
                          setRejectReason("");
                        }}
                      >
                        确认驳回
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setRejectOpen(false)}
                      >
                        取消
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div ref={focusRef} />
            )}

            <IssueCommentThread
              issueId={issue.id}
              projectId={issue.projectId}
              comments={comments}
              artifacts={artifacts}
              onOpenRun={setRunModalId}
              focusCommentId={item.focusCommentId}
            />
          </div>
        </div>
      </div>

      <aside className="hidden w-[280px] shrink-0 overflow-y-auto border-l border-[#eef2f6] bg-white px-4 py-4 xl:block">
        <div className="space-y-4 text-[12px]">
          <SideBlock label="Status">
            <IssueStatusBadge status={issue.status} />
          </SideBlock>
          <SideBlock label="Executor">
            <span className="text-slate-800">
              {executorLabel(issue.executor)}
            </span>
          </SideBlock>
          <SideBlock label="Project">
            <span className="text-slate-800">{project.name}</span>
          </SideBlock>
          <SideBlock label="Details">
            <div className="space-y-1 text-[#5a6779]">
              <div className="flex justify-between gap-2">
                <span>Created</span>
                <span>{formatDateTime(issue.createdAt)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span>Updated</span>
                <span>{formatRelativeTime(issue.updatedAt)}</span>
              </div>
            </div>
          </SideBlock>
          <SideBlock label="Execution Log">
            {latestRun ? (
              <button
                type="button"
                onClick={() => setRunModalId(latestRun.id)}
                className="w-full rounded-lg border border-[#eef2f6] px-2.5 py-2 text-left hover:bg-[#f8f9fb]"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-[#5a6779]">
                    {latestRun.id}
                  </span>
                  <RunStatusBadge status={latestRun.status} />
                </div>
                <p className="line-clamp-2 text-[11px] text-slate-700">
                  {latestRun.summary}
                </p>
              </button>
            ) : (
              <span className="text-[#94a3b8]">暂无 Run</span>
            )}
            {runs.length > 1 ? (
              <p className="mt-1.5 text-[11px] text-[#94a3b8]">
                Show past runs ({runs.length})
              </p>
            ) : null}
          </SideBlock>
          {item.type === "personal_claw_consent" ? (
            <Button
              size="sm"
              className="w-full bg-[#2773ff] hover:bg-[#1f63e0]"
              onClick={() => {
                acceptSquadInvitation({ inboxId: item.id });
                toast.success("已确认入队");
              }}
            >
              确认入队
            </Button>
          ) : null}
        </div>
      </aside>

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

function SessionDeliveryDetail({ item }: { item: InboxItem }) {
  if (item.source.kind !== "session") return null;
  const messages = INBOX_SESSION_THREADS[item.source.sessionId] ?? [];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-[#eef2f6] bg-white px-5 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-[12px] text-[#5a6779]">
              个人空间 › 会话 › {item.source.sessionTitle}
            </div>
            <h1 className="mt-1 text-[16px] font-semibold text-slate-900">
              {item.source.sessionTitle}
            </h1>
          </div>
          <Link
            href={`/my-claw/chat?sessionId=${encodeURIComponent(item.source.sessionId)}`}
            className="inline-flex items-center gap-1 text-[12px] font-medium text-[#2773ff] hover:underline"
          >
            打开完整会话
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
          <MessageSquare className="h-3 w-3" />
          Agent 已交付产物，待你确认
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-[#f8f9fb] px-5 py-5">
        <div className="mx-auto max-w-[680px] space-y-3">
          {messages.length === 0 ? (
            <EmptyDetail title="暂无会话内容" description="该会话暂无消息。" />
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "rounded-xl border px-4 py-3",
                  message.highlight
                    ? "border-emerald-200 bg-emerald-50/70"
                    : message.role === "system"
                      ? "border-transparent bg-transparent px-1 py-1"
                      : "border-[#eef2f6] bg-white"
                )}
              >
                {message.role === "system" ? (
                  <p className="text-center text-[12px] text-[#94a3b8]">
                    {message.content}
                  </p>
                ) : (
                  <>
                    <div className="mb-2 flex items-center gap-2">
                      <ActorAvatar
                        name={message.authorLabel}
                        type={message.role === "agent" ? "personal_claw" : "human"}
                        size="sm"
                      />
                      <span className="text-[13px] font-medium text-slate-800">
                        {message.authorLabel}
                      </span>
                      <span className="text-[11px] text-[#94a3b8]">
                        {formatRelativeTime(message.createdAt)}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-slate-700">
                      {message.content}
                    </p>
                    {message.artifactName ? (
                      <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#e7ecf0] bg-white px-3 py-2">
                        <FileText className="h-4 w-4 text-[#2773ff]" />
                        <div className="min-w-0">
                          <div className="truncate text-[12px] font-medium text-slate-800">
                            {message.artifactName}
                          </div>
                          <div className="text-[11px] text-[#5a6779]">
                            Agent 交付产物
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            ))
          )}

          <div className="rounded-xl border border-[#e7ecf0] bg-white px-4 py-3">
            <p className="text-[12px] text-[#5a6779]">Leave a reply…</p>
            <div className="mt-2 flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => toast.message("已标记稍后处理")}
              >
                稍后处理
              </Button>
              <Button
                size="sm"
                className="bg-[#2773ff] hover:bg-[#1f63e0]"
                onClick={() => toast.success("已确认产物")}
              >
                确认产物
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PersonalNoticeDetail({ item }: { item: InboxItem }) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[#eef2f6] px-5 py-3">
        <div className="text-[12px] text-[#5a6779]">{item.source.kind === "personal" ? item.source.label : ""}</div>
        <h1 className="mt-1 text-[16px] font-semibold text-slate-900">
          {item.title}
        </h1>
      </div>
      <div className="flex-1 px-5 py-6">
        <div className="mx-auto max-w-[560px] rounded-xl border border-[#eef2f6] bg-white p-5">
          <p className="text-[13px] leading-relaxed text-slate-700">
            {item.summary}
          </p>
          <div className="mt-4 flex gap-2">
            <Button asChild size="sm" className="bg-[#2773ff] hover:bg-[#1f63e0]">
              <Link href="/my-claw/automation">查看自动化</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/my-claw">回到个人空间</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectNoticeDetail({ item }: { item: InboxItem }) {
  const { acceptSquadInvitation } = useCollaboration();
  if (item.source.kind !== "project") return null;
  const href = `/my-claw/workspaces/${item.source.workspaceId}/projects/${item.source.projectId}`;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[#eef2f6] px-5 py-3">
        <div className="text-[12px] text-[#5a6779]">
          {item.source.workspaceName} › {item.source.projectName}
        </div>
        <h1 className="mt-1 text-[16px] font-semibold text-slate-900">
          {item.title}
        </h1>
      </div>
      <div className="flex-1 px-5 py-6">
        <div className="mx-auto max-w-[560px] rounded-xl border border-[#eef2f6] bg-white p-5">
          <p className="text-[13px] leading-relaxed text-slate-700">
            {item.summary}
          </p>
          <div className="mt-4 flex gap-2">
            {item.type === "personal_claw_consent" ? (
              <Button
                size="sm"
                className="bg-[#2773ff] hover:bg-[#1f63e0]"
                onClick={() => {
                  acceptSquadInvitation({ inboxId: item.id });
                  toast.success("已确认入队");
                }}
              >
                确认入队
              </Button>
            ) : null}
            <Button asChild size="sm" variant="outline">
              <Link href={href}>打开项目</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SideBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]">
        {label}
      </div>
      {children}
    </div>
  );
}

function EmptyDetail({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex h-full items-center justify-center px-6 text-center">
      <div>
        <p className="text-sm font-medium text-slate-900">{title}</p>
        <p className="mt-1 text-[13px] text-[#5a6779]">{description}</p>
      </div>
    </div>
  );
}
