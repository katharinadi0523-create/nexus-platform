"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessagesSquare, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useProjectConversation } from "@/components/my-claw/project-conversation/project-conversation-provider";

export function ConversationChatList() {
  const pathname = usePathname();
  const { state, currentUserId, getProject } = useProjectConversation();
  const [query, setQuery] = useState("");

  const activeConversationId = useMemo(() => {
    const match = pathname.match(
      /^\/my-claw\/projects\/[^/]+\/conversations\/([^/]+)/,
    );
    return match?.[1] ?? null;
  }, [pathname]);

  const conversations = useMemo(() => {
    const q = query.trim().toLowerCase();
    const activeProjectIds = new Set(
      state.projects
        .filter((project) => project.status === "active")
        .map((project) => project.id),
    );
    return state.threads
      .filter(
        (item) =>
          !item.archivedAt &&
          activeProjectIds.has(item.projectId) &&
          item.humanMemberIds.includes(currentUserId),
      )
      .filter((item) => {
        if (!q) return true;
        const project = getProject(item.projectId);
        return (
          item.name.toLowerCase().includes(q) ||
          (project?.name.toLowerCase().includes(q) ?? false)
        );
      })
      .sort((a, b) => {
        if (Boolean(a.pinned) !== Boolean(b.pinned)) {
          return a.pinned ? -1 : 1;
        }
        const aRunning = state.invocations.some(
          (inv) =>
            inv.threadId === a.id &&
            (inv.status === "running" || inv.status === "queued") &&
            !inv.parentInvocationId,
        );
        const bRunning = state.invocations.some(
          (inv) =>
            inv.threadId === b.id &&
            (inv.status === "running" || inv.status === "queued") &&
            !inv.parentInvocationId,
        );
        if (aRunning !== bRunning) return aRunning ? -1 : 1;
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });
  }, [
    currentUserId,
    getProject,
    query,
    state.invocations,
    state.projects,
    state.threads,
  ]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-3 pb-2 pt-1">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#5a6779]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索会话…"
            className="h-8 border-[#e2e8f0] bg-[#f8f9fb] pl-8 text-[13px] shadow-none focus-visible:ring-[#2773ff]/30"
          />
        </div>
      </div>

      <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
        {conversations.map((conversation) => {
          const href = `/my-claw/projects/${conversation.projectId}/conversations/${conversation.id}`;
          const active = conversation.id === activeConversationId;
          return (
            <Link
              key={conversation.id}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-colors",
                active
                  ? "bg-[#e8f0fb] text-[#2773ff]"
                  : "text-slate-700 hover:bg-slate-50",
              )}
            >
              <MessagesSquare
                className={cn(
                  "h-4 w-4 shrink-0",
                  active ? "text-[#2773ff]" : "text-[#5a6779]",
                )}
              />
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                {conversation.name}
              </span>
            </Link>
          );
        })}

        {conversations.length === 0 ? (
          <div className="px-2.5 py-8 text-center text-[12px] leading-5 text-[#5a6779]">
            {query.trim() ? "未找到匹配会话" : "暂无可见会话"}
          </div>
        ) : null}
      </nav>
    </div>
  );
}
