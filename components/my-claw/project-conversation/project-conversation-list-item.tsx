"use client";

import type { ProjectConversation } from "@/lib/mock/my-claw/project-conversation";
import { useProjectConversation } from "./project-conversation-provider";
import { ActorAvatar } from "./shared/actor-avatar";
import { formatRelativeTime } from "@/components/my-claw/project-issues/format";
import { cn } from "@/lib/utils";

interface ProjectConversationListItemProps {
  conversation: ProjectConversation;
  active?: boolean;
  onSelect: (conversationId: string) => void;
}

export function ProjectConversationListItem({
  conversation,
  active,
  onSelect,
}: ProjectConversationListItemProps) {
  const {
    getUser,
    getMessages,
    getConversationIssues,
    currentUserId,
    state,
  } = useProjectConversation();

  const messages = getMessages(conversation.projectId, conversation.id);
  const last = messages[messages.length - 1];
  const preview =
    last?.content?.replace(/\s+/g, " ").slice(0, 56) || "暂无消息";
  const issues = getConversationIssues(conversation.id);
  const myIssueCount = issues.filter(
    (issue) =>
      issue.waitingForCurrentUser ||
      issue.humanAssigneeIds.includes(currentUserId)
  ).length;
  const running = state.invocations.some(
    (inv) =>
      inv.threadId === conversation.id &&
      (inv.status === "running" || inv.status === "queued") &&
      !inv.parentInvocationId
  );

  const humans = conversation.humanMemberIds
    .map((id) => getUser(id))
    .filter(Boolean);

  return (
    <button
      type="button"
      onClick={() => onSelect(conversation.id)}
      className={cn(
        "w-full rounded-xl border px-3 py-2.5 text-left transition-colors",
        active
          ? "border-[#c9d7eb] bg-[#e8f0fb]"
          : "border-[#e2e8f0] bg-white hover:border-[#c9d7eb] hover:bg-[#fafbfd]"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {conversation.pinned ? (
              <span className="rounded bg-amber-50 px-1 py-0.5 text-[10px] text-amber-700">
                置顶
              </span>
            ) : null}
            <h3 className="truncate text-[13px] font-semibold text-slate-900">
              {conversation.name}
            </h3>
          </div>
          <p className="mt-1 line-clamp-1 text-[12px] text-[#5a6779]">
            {preview}
            {preview.length >= 56 ? "…" : ""}
          </p>
        </div>
        <span className="shrink-0 text-[11px] text-[#5a6779]">
          {formatRelativeTime(conversation.updatedAt)}
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex -space-x-1.5">
          {humans.slice(0, 3).map((user) => (
            <ActorAvatar
              key={user!.id}
              kind="human"
              name={user!.name}
              initials={user!.initials}
              size="sm"
              className="ring-1 ring-white"
            />
          ))}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-[#5a6779]">
          {running ? (
            <span className="rounded bg-[#e8f0fb] px-1.5 py-0.5 text-[#2773ff]">
              Agent 运行中
            </span>
          ) : null}
          {issues.length > 0 ? (
            <span className="rounded bg-[#f8f9fb] px-1.5 py-0.5">
              事项 {issues.length}
              {myIssueCount > 0 ? ` · 与我相关 ${myIssueCount}` : ""}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}
