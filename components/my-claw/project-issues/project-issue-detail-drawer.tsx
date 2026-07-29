"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  PROJECT_ISSUE_STATUS_LABELS,
  type ProjectIssueStatus,
} from "@/lib/mock/my-claw/project-issues";
import { useProjectConversation } from "@/components/my-claw/project-conversation/project-conversation-provider";
import { ActorAvatar } from "@/components/my-claw/project-conversation/shared/actor-avatar";
import { DrawerShell } from "@/components/my-claw/project-conversation/shared/drawer-shell";
import { IssueStatusBadge } from "./issue-status-badge";
import { IssuePrimaryConversation } from "./issue-primary-conversation";
import { formatRelativeTime } from "./format";
import { WorkspaceEntryIcon } from "@/components/claw-hub-next/detail/workspace-section";
import { FileDetailDrawer } from "@/components/my-claw/project-files/file-detail-drawer";
import { FileRowActions } from "@/components/my-claw/project-files/file-row-actions";
import { toast } from "sonner";

interface ProjectIssueDetailDrawerProps {
  issueId: string;
  onClose: () => void;
  onJumpToMessage?: (messageId: string) => void;
  onOpenConversation?: (conversationId: string, messageId?: string) => void;
}

const STATUS_OPTIONS: ProjectIssueStatus[] = [
  "clarifying",
  "in_progress",
  "waiting_for_human",
  "in_review",
  "changes_requested",
  "blocked",
  "done",
  "cancelled",
  "archived",
];

export function ProjectIssueDetailDrawer({
  issueId,
  onClose,
  onJumpToMessage,
  onOpenConversation,
}: ProjectIssueDetailDrawerProps) {
  const {
    getIssue,
    getUser,
    getActor,
    getArtifacts,
    getMessages,
    getVisibleConversations,
    canAccessConversation,
    currentUserId,
    bindIssueToConversation,
    acceptIssue,
    requestIssueChanges,
    cancelIssue,
    archiveIssue,
    updateIssue,
  } = useProjectConversation();

  const issue = getIssue(issueId);
  const [feedback, setFeedback] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [detailFileId, setDetailFileId] = useState<string | null>(null);

  const messages = useMemo(() => {
    if (!issue) return [];
    if (
      issue.conversationId &&
      !canAccessConversation(issue.conversationId, currentUserId)
    ) {
      return [];
    }
    const all = getMessages(issue.projectId, issue.conversationId);
    return issue.relatedMessageIds
      .map((id) => all.find((item) => item.id === id))
      .filter(Boolean);
  }, [canAccessConversation, currentUserId, getMessages, issue]);

  const bindable = useMemo(() => {
    if (!issue || issue.conversationId) return [];
    return getVisibleConversations(issue.projectId, currentUserId).map(
      (item) => item.id
    );
  }, [currentUserId, getVisibleConversations, issue]);

  if (!issue) {
    return (
      <DrawerShell title="事项详情" onClose={onClose}>
        <p className="text-[13px] text-[#5a6779]">事项不存在或已移除</p>
      </DrawerShell>
    );
  }

  if (detailFileId) {
    return (
      <FileDetailDrawer
        fileId={detailFileId}
        onClose={() => setDetailFileId(null)}
      />
    );
  }

  const artifacts = getArtifacts(issue.artifactIds);
  const archived =
    issue.status === "archived" || issue.status === "cancelled";

  return (
    <DrawerShell
      title={issue.key}
      onClose={onClose}
      footer={
        !archived ? (
          <div className="flex flex-wrap gap-2">
            {issue.status === "in_review" ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  className="h-8 bg-[#2773ff] px-3 text-[12px] hover:bg-[#1f63e0]"
                  onClick={() => acceptIssue(issue.id)}
                >
                  接受
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 border-[#e2e8f0] px-3 text-[12px]"
                  onClick={() => setShowFeedback((v) => !v)}
                >
                  要求返工
                </Button>
              </>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 border-[#e2e8f0] px-3 text-[12px]"
              onClick={() => cancelIssue(issue.id)}
            >
              取消事项
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 border-[#e2e8f0] px-3 text-[12px]"
              onClick={() => archiveIssue(issue.id)}
            >
              归档
            </Button>
          </div>
        ) : null
      }
    >
      <div className="space-y-5">
        <section>
          <h3 className="text-[16px] font-semibold text-slate-900">
            {issue.title}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <IssueStatusBadge
              status={
                issue.status === "changes_requested"
                  ? "in_progress"
                  : issue.status
              }
            />
            <span className="text-[11px] text-[#5a6779]">
              更新于 {formatRelativeTime(issue.updatedAt)}
            </span>
          </div>
          {issue.summary ? (
            <p className="mt-2 text-[13px] leading-5 text-[#5a6779]">
              {issue.summary}
            </p>
          ) : null}
          {issue.latestProgress ? (
            <p className="mt-2 rounded-lg bg-[#f8f9fb] px-3 py-2 text-[12px] text-slate-700">
              最新进展：{issue.latestProgress}
            </p>
          ) : null}
        </section>

        <IssuePrimaryConversation
          issueId={issue.id}
          bindableConversationIds={bindable}
          onBind={(conversationId) =>
            bindIssueToConversation(issue.id, conversationId)
          }
          onOpenConversation={onOpenConversation}
        />

        <section>
          <div className="mb-1.5 text-[11px] font-medium text-[#5a6779]">
            验收标准
          </div>
          {issue.acceptanceCriteria.length === 0 ? (
            <p className="text-[12px] text-[#5a6779]">暂无</p>
          ) : (
            <ul className="space-y-1">
              {issue.acceptanceCriteria.map((item) => (
                <li
                  key={item}
                  className="rounded-md border border-[#eef2f6] px-2.5 py-1.5 text-[12px] text-slate-700"
                >
                  {item}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="mb-1.5 text-[11px] font-medium text-[#5a6779]">
            责任人
          </div>
          <div className="flex flex-wrap gap-2">
            {issue.humanAssigneeIds.map((userId) => {
              const user = getUser(userId);
              if (!user) return null;
              return (
                <div
                  key={userId}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#eef2f6] bg-white px-2 py-1"
                >
                  <ActorAvatar
                    kind="human"
                    name={user.name}
                    initials={user.initials}
                    size="sm"
                  />
                  <span className="text-[12px] text-slate-700">{user.name}</span>
                </div>
              );
            })}
            {issue.agentAssigneeIds.map((actorId) => {
              const actor = getActor(actorId);
              if (!actor) return null;
              return (
                <div
                  key={actorId}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#eef2f6] bg-white px-2 py-1"
                >
                  <ActorAvatar
                    kind="agent"
                    name={actor.name}
                    runtimeStatus={actor.runtimeStatus}
                    size="sm"
                  />
                  <span className="text-[12px] text-slate-700">{actor.name}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-1.5 text-[11px] font-medium text-[#5a6779]">
            更新状态
          </div>
          <select
            value={issue.status}
            disabled={archived}
            onChange={(e) =>
              updateIssue(issue.id, {
                status: e.target.value as ProjectIssueStatus,
              })
            }
            className="h-8 w-full rounded-md border border-[#e2e8f0] bg-[#f8f9fb] px-2 text-[12px] text-slate-700 outline-none focus:ring-2 focus:ring-[#2773ff]/30"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {PROJECT_ISSUE_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </section>

        {showFeedback ? (
          <section className="rounded-lg border border-[#e2e8f0] bg-[#f8f9fb] p-3">
            <div className="mb-1.5 text-[12px] font-medium text-slate-800">
              返工反馈
            </div>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              placeholder="说明需要修改的点…"
              className="w-full rounded-md border border-[#e2e8f0] bg-white px-2.5 py-2 text-[12px] outline-none focus:ring-2 focus:ring-[#2773ff]/30"
            />
            <div className="mt-2 flex gap-2">
              <Button
                type="button"
                size="sm"
                className="h-7 bg-[#2773ff] px-2.5 text-[12px] hover:bg-[#1f63e0]"
                onClick={() => {
                  requestIssueChanges(issue.id, feedback.trim() || "请按反馈返工");
                  setShowFeedback(false);
                  setFeedback("");
                }}
              >
                提交返工
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-[12px]"
                onClick={() => setShowFeedback(false)}
              >
                取消
              </Button>
            </div>
          </section>
        ) : null}

        <section>
          <div className="mb-1.5 text-[11px] font-medium text-[#5a6779]">
            关联消息
          </div>
          {issue.conversationId &&
          !canAccessConversation(issue.conversationId, currentUserId) ? (
            <p className="text-[12px] text-[#5a6779]">
              无权访问主会话，不展示来源消息原文。
            </p>
          ) : messages.length === 0 ? (
            <p className="text-[12px] text-[#5a6779]">暂无关联消息</p>
          ) : (
            <ul className="space-y-1">
              {messages.map((message) =>
                message ? (
                  <li key={message.id}>
                    <button
                      type="button"
                      onClick={() => onJumpToMessage?.(message.id)}
                      className="w-full rounded-md border border-[#eef2f6] px-2.5 py-2 text-left transition-colors hover:bg-[#f8f9fb]"
                    >
                      <div className="line-clamp-2 text-[12px] text-slate-700">
                        {message.content}
                      </div>
                      <div className="mt-1 text-[11px] text-[#2773ff]">
                        跳转到消息
                      </div>
                    </button>
                  </li>
                ) : null
              )}
            </ul>
          )}
        </section>

        <section>
          <div className="mb-1.5 text-[11px] font-medium text-[#5a6779]">
            文件
          </div>
          {artifacts.length === 0 ? (
            <p className="text-[12px] text-[#5a6779]">暂无文件</p>
          ) : (
            <ul className="space-y-1">
              {artifacts.map((item) => {
                const fileName = (() => {
                  if (item.name.includes(".")) return item.name;
                  switch (item.kind) {
                    case "commit":
                      return `${item.name}.diff`;
                    case "pull_request":
                      return `${item.name}.pr.md`;
                    case "data":
                      return `${item.name}.csv`;
                    case "link":
                    case "preview":
                      return `${item.name}.url`;
                    default:
                      return `${item.name}.md`;
                  }
                })();
                return (
                  <li
                    key={item.id}
                    className="flex items-center gap-2.5 rounded-md border border-[#eef2f6] px-2.5 py-2"
                  >
                    <WorkspaceEntryIcon
                      entry={{ kind: "file", name: fileName }}
                      className="h-5 w-5"
                    />
                    <div className="min-w-0 flex-1 truncate text-[12px] font-medium text-slate-800">
                      {fileName}
                    </div>
                    <FileRowActions
                      fileName={fileName}
                      onPreview={() =>
                        toast.message(`预览 ${fileName}（原型占位）`)
                      }
                      onDownload={() =>
                        toast.success(`已开始下载 ${fileName}`)
                      }
                      onDetails={() => {
                        if (item.fileNodeId) {
                          setDetailFileId(item.fileNodeId);
                        } else {
                          toast.message("该产物暂无关联文件节点");
                        }
                      }}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </DrawerShell>
  );
}
