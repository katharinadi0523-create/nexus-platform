"use client";

import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  AtSign,
  Bot,
  Inbox,
  ShieldAlert,
  UserPlus,
} from "lucide-react";
import type { InboxEventType } from "@/lib/mock/my-claw/project-conversation";
import { useProjectConversation } from "../project-conversation-provider";
import { cn } from "@/lib/utils";

function inboxIcon(type: InboxEventType) {
  switch (type) {
    case "human_mentioned":
      return AtSign;
    case "agent_reply_ready":
      return Bot;
    case "agent_execution_failed":
      return AlertTriangle;
    case "personal_claw_consent":
      return ShieldAlert;
    case "project_invitation":
      return UserPlus;
    case "session_degraded":
      return AlertTriangle;
    default:
      return Inbox;
  }
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ProjectInboxPage() {
  const router = useRouter();
  const {
    state,
    markInboxRead,
    getProject,
    getWorkspace,
    openExecution,
  } = useProjectConversation();

  const items = [...state.inbox].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleClick = (id: string) => {
    const item = state.inbox.find((entry) => entry.id === id);
    if (!item) return;
    markInboxRead(item.id);

    if (
      item.type === "agent_execution_failed" &&
      item.invocationId &&
      item.workspaceId &&
      item.projectId
    ) {
      router.push(
        `/my-claw/workspaces/${item.workspaceId}/projects/${item.projectId}?message=${item.messageId ?? ""}`
      );
      window.setTimeout(() => {
        if (item.invocationId) openExecution(item.invocationId);
      }, 120);
      return;
    }

    if (item.workspaceId && item.projectId) {
      const href = item.messageId
        ? `/my-claw/workspaces/${item.workspaceId}/projects/${item.projectId}?message=${item.messageId}`
        : `/my-claw/workspaces/${item.workspaceId}/projects/${item.projectId}`;
      router.push(href);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f8f9fb]">
      <header className="shrink-0 border-b border-[#eef2f6] bg-white px-6 py-4">
        <h1 className="text-[18px] font-semibold text-slate-900">Inbox</h1>
        <p className="mt-0.5 text-[13px] text-[#5a6779]">
          提及、Agent 回复、执行失败与授权提醒
        </p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#5a6779]">
            <Inbox className="mb-3 h-8 w-8 opacity-50" />
            <p className="text-[13px]">暂无通知</p>
          </div>
        ) : (
          <ul className="mx-auto max-w-2xl space-y-2">
            {items.map((item) => {
              const Icon = inboxIcon(item.type);
              const project = item.projectId
                ? getProject(item.projectId)
                : undefined;
              const workspace = item.workspaceId
                ? getWorkspace(item.workspaceId)
                : undefined;

              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleClick(item.id)}
                    className={cn(
                      "flex w-full gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                      item.read
                        ? "border-[#eef2f6] bg-white hover:bg-[#f8f9fb]"
                        : "border-[#d6e6fb] bg-[#f5f9ff] hover:bg-[#eef5ff]"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                        item.type === "agent_execution_failed"
                          ? "bg-red-50 text-red-600"
                          : "bg-[#e8f0fb] text-[#2773ff]"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="truncate text-[13px] font-semibold text-slate-900">
                          {item.title}
                        </div>
                        <span className="shrink-0 text-[11px] text-[#5a6779]">
                          {formatTime(item.createdAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-[12px] text-[#5a6779]">
                        {item.body}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2 text-[11px] text-[#5a6779]">
                        {workspace ? <span>{workspace.name}</span> : null}
                        {project ? (
                          <>
                            <span>·</span>
                            <span>{project.name}</span>
                          </>
                        ) : null}
                        {!item.read ? (
                          <span className="ml-auto rounded bg-[#2773ff] px-1.5 py-0.5 text-[10px] font-medium text-white">
                            未读
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
